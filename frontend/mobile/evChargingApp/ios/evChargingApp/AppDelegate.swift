import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import GoogleSignIn
import FBSDKCoreKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {

    // Configure Facebook SDK
    ApplicationDelegate.shared.application(
      application,
      didFinishLaunchingWithOptions: launchOptions
    )

    // Google Sign-In is now configured in the JavaScript code (OAuthButtons.jsx).
    // No native configuration is needed here.

    return setupReactNative(application: application, launchOptions: launchOptions)
  }
  
  private func setupReactNative(application: UIApplication, launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "evChargingApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
  
  // Handle URL schemes for OAuth
  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey : Any] = [:]
  ) -> Bool {
    
    // Handle Facebook URL
    if ApplicationDelegate.shared.application(app, open: url, options: options) {
      return true
    }
    
    // Handle Google Sign-In URL
    if GIDSignIn.sharedInstance.handle(url) {
      return true
    }
    
    return false
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    // Check if pre-built bundle exists (for faster startup)
    if let bundleURL = Bundle.main.url(forResource: "main", withExtension: "jsbundle") {
      print("⚡️ Using pre-built bundle for fast startup!")
      return bundleURL
    }
    // Otherwise use Metro bundler
    print("🔄 Connecting to Metro bundler...")
    // NOTE: IP will be auto-updated by dev:device script
    return URL(string: "http://192.168.1.32:8081/index.bundle?platform=ios")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
