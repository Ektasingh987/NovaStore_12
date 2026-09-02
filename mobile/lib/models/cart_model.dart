import 'product_model.dart';

class CartItemModel {
  final String productId;
  final ProductModel? product;
  final int quantity;
  final double? priceAtAdd;

  CartItemModel({
    required this.productId,
    this.product,
    required this.quantity,
    this.priceAtAdd,
  });

  double get unitPrice {
    if (product != null) return product!.effectivePrice;
    return priceAtAdd ?? 0.0;
  }

  double get originalUnitPrice {
    if (product != null) return product!.price;
    return priceAtAdd ?? 0.0;
  }

  double get itemTotal => unitPrice * quantity;
  double get originalTotal => originalUnitPrice * quantity;
  double get discountAmount => originalTotal - itemTotal;

  factory CartItemModel.fromJson(Map<String, dynamic> json) {
    String pId = '';
    ProductModel? pModel;

    if (json['productId'] is Map<String, dynamic>) {
      pModel = ProductModel.fromJson(json['productId'] as Map<String, dynamic>);
      pId = pModel.id;
    } else if (json['productId'] is String) {
      pId = json['productId'] as String;
    }

    return CartItemModel(
      productId: pId,
      product: pModel,
      quantity: json['quantity'] as int? ?? 1,
      priceAtAdd: (json['priceAtAdd'] as num?)?.toDouble(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'quantity': quantity,
      'priceAtAdd': priceAtAdd,
    };
  }
}

class CartModel {
  final String id;
  final String userId;
  final List<CartItemModel> items;
  final int itemCount;
  final double subtotal;

  CartModel({
    required this.id,
    required this.userId,
    this.items = const [],
    this.itemCount = 0,
    this.subtotal = 0.0,
  });

  // Calculate live totals taking into account discounts and delivery charges
  double get calculatedSubtotal {
    return items.fold(0.0, (sum, item) => sum + item.originalTotal);
  }

  double get calculatedDiscount {
    return items.fold(0.0, (sum, item) => sum + (item.discountAmount > 0 ? item.discountAmount : 0));
  }

  double get calculatedDeliveryCharge {
    if (items.isEmpty) return 0.0;
    // Free delivery over ₹500, else ₹40
    final totalAfterDiscount = calculatedSubtotal - calculatedDiscount;
    return totalAfterDiscount >= 500 ? 0.0 : 40.0;
  }

  double get calculatedTotal {
    if (items.isEmpty) return 0.0;
    return (calculatedSubtotal - calculatedDiscount) + calculatedDeliveryCharge;
  }

  int get totalItems => items.fold(0, (sum, item) => sum + item.quantity);

  factory CartModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    final itemsList = rawItems
        .map((item) => CartItemModel.fromJson(item as Map<String, dynamic>))
        .toList();

    return CartModel(
      id: (json['_id'] ?? json['id'] ?? '') as String,
      userId: (json['userId'] ?? '') as String,
      items: itemsList,
      itemCount: json['itemCount'] as int? ?? itemsList.length,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
    );
  }

  factory CartModel.empty() {
    return CartModel(id: '', userId: '', items: [], itemCount: 0, subtotal: 0.0);
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      '_id': id,
      'userId': userId,
      'items': items.map((i) => i.toJson()).toList(),
      'itemCount': itemCount,
      'subtotal': subtotal,
    };
  }
}
