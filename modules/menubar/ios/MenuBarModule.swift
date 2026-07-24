import ExpoModulesCore

public class MenuBarModule: Module {
  public func definition() -> ModuleDefinition {
    Name("MenuBar")

    Function("openMainWindow") {
      DispatchQueue.main.async {
        NotificationCenter.default.post(name: Notification.Name("GHTOpenMainWindow"), object: nil)
      }
    }

    Function("closePopover") {
      DispatchQueue.main.async {
        NotificationCenter.default.post(name: Notification.Name("GHTClosePopover"), object: nil)
      }
    }
  }
}
