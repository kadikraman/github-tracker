import ExpoModulesCore
import Sparkle

let updateStatusEvent = "onUpdateStatus"

public class UpdaterModule: Module {
  private var updater: SPUUpdater?
  private var driver: BannerUserDriver?

  public func definition() -> ModuleDefinition {
    Name("Updater")

    Events(updateStatusEvent)

    Function("getCurrentVersion") { () -> [String: String] in
      let info = Bundle.main.infoDictionary ?? [:]
      return [
        "version": info["CFBundleShortVersionString"] as? String ?? "0",
        "build": info["CFBundleVersion"] as? String ?? "0",
      ]
    }

    Function("getState") { () -> [String: Any] in
      self.driver?.statusPayload ?? ["phase": "idle"]
    }

    AsyncFunction("start") { () -> Bool in
      try self.startUpdaterIfNeeded()
    }.runOnQueue(.main)

    AsyncFunction("checkForUpdates") { () in
      guard let updater = self.updater else {
        throw UpdaterNotStartedException()
      }
      if updater.canCheckForUpdates {
        updater.checkForUpdates()
      }
    }.runOnQueue(.main)

    AsyncFunction("installAndRelaunch") { () in
      guard let driver = self.driver, driver.invokePendingInstall() else {
        throw NoPendingUpdateException()
      }
    }.runOnQueue(.main)
  }

  // SPUUpdater is main-thread-only and start() must run after app launch;
  // JS calls this from module scope, after applicationDidFinishLaunching.
  private func startUpdaterIfNeeded() throws -> Bool {
    if updater != nil {
      return true
    }
    #if DEBUG
    // Metro dev builds must not hit the release feed; opt in with
    // `defaults write dev.kadi.github-tracker GHTEnableUpdaterInDebug -bool YES`.
    guard UserDefaults.standard.bool(forKey: "GHTEnableUpdaterInDebug") else {
      return false
    }
    #endif
    let driver = BannerUserDriver { [weak self] payload in
      self?.sendEvent(updateStatusEvent, payload)
    }
    let updater = SPUUpdater(
      hostBundle: .main,
      applicationBundle: .main,
      userDriver: driver,
      delegate: nil
    )
    updater.automaticallyChecksForUpdates = true
    updater.automaticallyDownloadsUpdates = true
    try updater.start()
    self.driver = driver
    self.updater = updater
    return true
  }
}

final class UpdaterNotStartedException: Exception {
  override var reason: String {
    "The updater has not been started"
  }
}

final class NoPendingUpdateException: Exception {
  override var reason: String {
    "No downloaded update is ready to install"
  }
}

/// Feeds Sparkle's update lifecycle to the React banner instead of Sparkle's
/// own windows. Downloads run automatically; the one user decision is the
/// final "restart to update", whose reply is parked in `pendingInstallReply`
/// until JS calls `installAndRelaunch` (quitting instead still installs).
final class BannerUserDriver: NSObject, SPUUserDriver {
  private let emit: ([String: Any]) -> Void
  private var pendingInstallReply: ((SPUUserUpdateChoice) -> Void)?
  private var pendingVersion: String?
  private var expectedLength: UInt64 = 0
  private var receivedLength: UInt64 = 0
  private var lastReportedPercent = -1

  // getState reads from the JS thread while Sparkle writes on main.
  private let stateLock = NSLock()
  private var currentPayload: [String: Any] = ["phase": "idle"]

  var statusPayload: [String: Any] {
    stateLock.lock()
    defer { stateLock.unlock() }
    return currentPayload
  }

  init(emit: @escaping ([String: Any]) -> Void) {
    self.emit = emit
  }

  private func setStatus(_ payload: [String: Any]) {
    stateLock.lock()
    currentPayload = payload
    stateLock.unlock()
    emit(payload)
  }

  private func downloadingPayload(progress: Double? = nil) -> [String: Any] {
    var payload: [String: Any] = ["phase": "downloading"]
    if let version = pendingVersion {
      payload["version"] = version
    }
    if let progress {
      payload["progress"] = progress
    }
    return payload
  }

  func invokePendingInstall() -> Bool {
    guard let reply = pendingInstallReply else {
      return false
    }
    pendingInstallReply = nil
    reply(.install)
    return true
  }

  // MARK: - SPUUserDriver

  func show(
    _ request: SPUUpdatePermissionRequest,
    reply: @escaping (SUUpdatePermissionResponse) -> Void
  ) {
    reply(SUUpdatePermissionResponse(automaticUpdateChecks: true, sendSystemProfile: false))
  }

  func showUserInitiatedUpdateCheck(cancellation: @escaping () -> Void) {
    setStatus(["phase": "checking"])
  }

  func showUpdateFound(
    with appcastItem: SUAppcastItem,
    state: SPUUserUpdateState,
    reply: @escaping (SPUUserUpdateChoice) -> Void
  ) {
    pendingVersion = appcastItem.displayVersionString
    if state.stage == .installing {
      // Already staged (e.g. downloaded in a previous session).
      pendingInstallReply = reply
      setStatus(["phase": "ready", "version": appcastItem.displayVersionString])
    } else {
      setStatus(downloadingPayload())
      reply(.install)
    }
  }

  func showUpdateReleaseNotes(with downloadData: SPUDownloadData) {}

  func showUpdateReleaseNotesFailedToDownloadWithError(_ error: Error) {}

  func showUpdateNotFoundWithError(_ error: Error, acknowledgement: @escaping () -> Void) {
    setStatus(["phase": "upToDate"])
    acknowledgement()
  }

  func showUpdaterError(_ error: Error, acknowledgement: @escaping () -> Void) {
    pendingInstallReply = nil
    setStatus(["phase": "error", "message": error.localizedDescription])
    acknowledgement()
  }

  func showDownloadInitiated(cancellation: @escaping () -> Void) {
    expectedLength = 0
    receivedLength = 0
    lastReportedPercent = -1
    setStatus(downloadingPayload())
  }

  func showDownloadDidReceiveExpectedContentLength(_ expectedContentLength: UInt64) {
    expectedLength = expectedContentLength
  }

  func showDownloadDidReceiveData(ofLength length: UInt64) {
    receivedLength += length
    guard expectedLength > 0 else {
      return
    }
    let percent = Int(Double(receivedLength) / Double(expectedLength) * 100)
    if percent != lastReportedPercent {
      lastReportedPercent = percent
      setStatus(downloadingPayload(progress: Double(percent) / 100))
    }
  }

  func showDownloadDidStartExtractingUpdate() {
    setStatus(downloadingPayload())
  }

  func showExtractionReceivedProgress(_ progress: Double) {}

  func showReady(toInstallAndRelaunch reply: @escaping (SPUUserUpdateChoice) -> Void) {
    pendingInstallReply = reply
    var payload: [String: Any] = ["phase": "ready"]
    if let version = pendingVersion {
      payload["version"] = version
    }
    setStatus(payload)
  }

  func showInstallingUpdate(
    withApplicationTerminated applicationTerminated: Bool,
    retryTerminatingApplication: @escaping () -> Void
  ) {
    setStatus(["phase": "installing"])
  }

  func showUpdateInstalledAndRelaunched(_ relaunched: Bool, acknowledgement: @escaping () -> Void) {
    acknowledgement()
  }

  func showUpdateInFocus() {}

  func dismissUpdateInstallation() {
    if pendingInstallReply == nil {
      setStatus(["phase": "idle"])
    }
  }
}
