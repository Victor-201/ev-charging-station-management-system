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
    
    // Configure Google Sign-In
    guard let path = Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist"),
          let plist = NSDictionary(contentsOfFile: path),
          let clientId = plist["CLIENT_ID"] as? String else {
      print("Error: GoogleService-Info.plist not found or CLIENT_ID missing")
      // Continue without Google Sign-In
      return setupReactNative(application: application, launchOptions: launchOptions)
    }
    
    guard let gidConfiguration = GIDConfiguration(clientID: clientId) else {
      print("Error: Failed to create GIDConfiguration")
      return setupReactNative(application: application, launchOptions: launchOptions)
    }
    
    GIDSignIn.sharedInstance.configuration = gidConfiguration
    
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
    // NOTE: IP will be auto-updated by dev:device script
    return URL(string: "http://192.168.1.32:8081/index.bundle?platform=ios")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
