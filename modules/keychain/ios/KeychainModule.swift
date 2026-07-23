import ExpoModulesCore
import Security

public class KeychainModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Keychain")

    Function("get") { (service: String, account: String) -> String? in
      let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: account,
        kSecReturnData as String: true,
        kSecMatchLimit as String: kSecMatchLimitOne,
      ]
      var result: AnyObject?
      let status = SecItemCopyMatching(query as CFDictionary, &result)
      guard status == errSecSuccess, let data = result as? Data else {
        return nil
      }
      return String(data: data, encoding: .utf8)
    }

    Function("set") { (service: String, account: String, value: String) throws in
      guard let data = value.data(using: .utf8) else {
        throw KeychainException(errSecParam)
      }
      let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: account,
      ]
      var status = SecItemUpdate(
        query as CFDictionary,
        [kSecValueData as String: data] as CFDictionary
      )
      if status == errSecItemNotFound {
        var add = query
        add[kSecValueData as String] = data
        status = SecItemAdd(add as CFDictionary, nil)
      }
      guard status == errSecSuccess else {
        throw KeychainException(status)
      }
    }

    Function("remove") { (service: String, account: String) throws in
      let query: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: service,
        kSecAttrAccount as String: account,
      ]
      let status = SecItemDelete(query as CFDictionary)
      guard status == errSecSuccess || status == errSecItemNotFound else {
        throw KeychainException(status)
      }
    }
  }
}

final class KeychainException: GenericException<OSStatus> {
  override var reason: String {
    "Keychain operation failed (OSStatus \(param))"
  }
}
