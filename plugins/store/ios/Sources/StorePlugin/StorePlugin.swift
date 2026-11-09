import Foundation
import Capacitor
import StoreKit

// The game's App Store purchases (StoreKit 2), seen from the game as Capacitor.Plugins.Store:
//   products({ ids })  -> { products: [{ id, price, title }] }   price already in the player's own currency
//   buy({ id })        -> { state: 'bought' | 'pending' | 'cancelled' | 'failed' }
//   owned()            -> { ids }   what this Apple account owns now (works offline)
//   restore()          -> { ids }   asks the App Store to sync first (Restore purchases)
//   event 'owned'      -> { ids, revoked }   a purchase finished outside buy() (Ask to Buy, an interrupted purchase) or refunded
@objc(StorePlugin)
public class StorePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StorePlugin"
    public let jsName = "Store"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "products", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "buy", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "owned", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restore", returnType: CAPPluginReturnPromise)
    ]
    private var updates: Task<Void, Never>?

    override public func load() {
        updates = Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                await transaction.finish()
                self?.notifyListeners("owned", data: [
                    "ids": [transaction.productID],
                    "revoked": transaction.revocationDate != nil
                ])
            }
        }
    }

    deinit { updates?.cancel() }

    @objc func products(_ call: CAPPluginCall) {
        let ids = call.getArray("ids", String.self) ?? []
        Task {
            do {
                let list = try await Product.products(for: ids)
                call.resolve(["products": list.map { ["id": $0.id, "price": $0.displayPrice, "title": $0.displayName] }])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func buy(_ call: CAPPluginCall) {
        guard let id = call.getString("id") else {
            call.reject("Must provide an id")
            return
        }
        Task {
            do {
                guard let product = try await Product.products(for: [id]).first else {
                    call.reject("Product not found")
                    return
                }
                switch try await product.purchase() {
                case .success(let result):
                    if case .verified(let transaction) = result {
                        await transaction.finish()
                        call.resolve(["state": "bought"])
                    } else {
                        call.resolve(["state": "failed"])
                    }
                case .pending:
                    call.resolve(["state": "pending"])
                case .userCancelled:
                    call.resolve(["state": "cancelled"])
                @unknown default:
                    call.resolve(["state": "failed"])
                }
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    private func ownedIds() async -> [String] {
        var ids: [String] = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result, transaction.revocationDate == nil {
                ids.append(transaction.productID)
            }
        }
        return ids
    }

    @objc func owned(_ call: CAPPluginCall) {
        Task { call.resolve(["ids": await self.ownedIds()]) }
    }

    @objc func restore(_ call: CAPPluginCall) {
        Task {
            // asks the player to sign in if needed; a cancel there still reports what is already owned
            try? await AppStore.sync()
            call.resolve(["ids": await self.ownedIds()])
        }
    }
}
