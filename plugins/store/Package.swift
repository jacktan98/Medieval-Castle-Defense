// swift-tools-version: 5.9
import PackageDescription

// The game's own purchase plugin (StoreKit 2), picked up by `npx cap sync ios` like any Capacitor plugin.
let package = Package(
    name: "CastleStore",
    platforms: [.iOS(.v15)],
    products: [
        .library(
            name: "CastleStore",
            targets: ["StorePlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "StorePlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                .product(name: "Cordova", package: "capacitor-swift-pm")
            ],
            path: "ios/Sources/StorePlugin")
    ]
)
