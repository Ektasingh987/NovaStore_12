class OrderItemModel {
  final String productId;
  final String name;
  final String? image;
  final double price;
  final double discount;
  final int quantity;

  OrderItemModel({
    required this.productId,
    required this.name,
    this.image,
    required this.price,
    this.discount = 0.0,
    required this.quantity,
  });

  double get effectivePrice {
    if (discount > 0) {
      return double.parse((price * (1 - discount / 100)).toStringAsFixed(2));
    }
    return price;
  }

  double get total => effectivePrice * quantity;

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    String pId = '';
    if (json['productId'] is Map<String, dynamic>) {
      pId = (json['productId']['_id'] ?? json['productId']['id'] ?? '') as String;
    } else if (json['productId'] is String) {
      pId = json['productId'] as String;
    }

    return OrderItemModel(
      productId: pId,
      name: (json['name'] ?? '') as String,
      image: json['image'] as String?,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      quantity: json['quantity'] as int? ?? 1,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'productId': productId,
      'name': name,
      'image': image,
      'price': price,
      'discount': discount,
      'quantity': quantity,
    };
  }
}

class DeliveryAddressModel {
  final String fullName;
  final String phone;
  final String line1;
  final String line2;
  final String city;
  final String state;
  final String postalCode;
  final String country;

  DeliveryAddressModel({
    required this.fullName,
    required this.phone,
    required this.line1,
    this.line2 = '',
    required this.city,
    required this.state,
    required this.postalCode,
    this.country = 'India',
  });

  String get formattedAddress {
    final parts = [
      line1,
      if (line2.isNotEmpty) line2,
      city,
      '$state - $postalCode',
      country,
    ];
    return parts.join(', ');
  }

  factory DeliveryAddressModel.fromJson(Map<String, dynamic> json) {
    return DeliveryAddressModel(
      fullName: (json['fullName'] ?? '') as String,
      phone: (json['phone'] ?? '') as String,
      line1: (json['line1'] ?? '') as String,
      line2: (json['line2'] ?? '') as String,
      city: (json['city'] ?? '') as String,
      state: (json['state'] ?? '') as String,
      postalCode: (json['postalCode'] ?? '') as String,
      country: (json['country'] ?? 'India') as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'phone': phone,
      'line1': line1,
      'line2': line2,
      'city': city,
      'state': state,
      'postalCode': postalCode,
      'country': country,
    };
  }
}

class OrderStatusHistoryItem {
  final String status;
  final DateTime changedAt;
  final String note;

  OrderStatusHistoryItem({
    required this.status,
    required this.changedAt,
    this.note = '',
  });

  factory OrderStatusHistoryItem.fromJson(Map<String, dynamic> json) {
    return OrderStatusHistoryItem(
      status: (json['status'] ?? '') as String,
      changedAt: json['changedAt'] != null
          ? DateTime.tryParse(json['changedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      note: (json['note'] ?? '') as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'status': status,
      'changedAt': changedAt.toIso8601String(),
      'note': note,
    };
  }
}

class OrderModel {
  final String id;
  final String orderNumber;
  final String userId;
  final List<OrderItemModel> items;
  final double subtotal;
  final double discount;
  final double deliveryCharge;
  final double total;
  final DeliveryAddressModel address;
  final String paymentMethod;
  final String paymentStatus;
  final String? paymentId;
  final String status;
  final List<OrderStatusHistoryItem> statusHistory;
  final String notes;
  final DateTime? createdAt;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.userId,
    required this.items,
    required this.subtotal,
    this.discount = 0.0,
    this.deliveryCharge = 0.0,
    required this.total,
    required this.address,
    required this.paymentMethod,
    this.paymentStatus = 'Unpaid',
    this.paymentId,
    this.status = 'Pending',
    this.statusHistory = const [],
    this.notes = '',
    this.createdAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? [];
    final itemsList = rawItems
        .map((i) => OrderItemModel.fromJson(i as Map<String, dynamic>))
        .toList();

    final rawHistory = json['statusHistory'] as List<dynamic>? ?? [];
    final historyList = rawHistory
        .map((h) => OrderStatusHistoryItem.fromJson(h as Map<String, dynamic>))
        .toList();

    return OrderModel(
      id: (json['_id'] ?? json['id'] ?? '') as String,
      orderNumber: (json['orderNumber'] ?? '') as String,
      userId: (json['userId'] is Map
          ? (json['userId']['_id'] ?? json['userId']['id'])
          : json['userId'] ?? '') as String,
      items: itemsList,
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      deliveryCharge: (json['deliveryCharge'] as num?)?.toDouble() ?? 0.0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      address: json['address'] != null
          ? DeliveryAddressModel.fromJson(json['address'] as Map<String, dynamic>)
          : DeliveryAddressModel(
              fullName: '',
              phone: '',
              line1: '',
              city: '',
              state: '',
              postalCode: '',
            ),
      paymentMethod: (json['paymentMethod'] ?? 'COD') as String,
      paymentStatus: (json['paymentStatus'] ?? 'Unpaid') as String,
      paymentId: json['paymentId'] as String?,
      status: (json['status'] ?? 'Pending') as String,
      statusHistory: historyList,
      notes: (json['notes'] ?? '') as String,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      '_id': id,
      'orderNumber': orderNumber,
      'userId': userId,
      'items': items.map((i) => i.toJson()).toList(),
      'subtotal': subtotal,
      'discount': discount,
      'deliveryCharge': deliveryCharge,
      'total': total,
      'address': address.toJson(),
      'paymentMethod': paymentMethod,
      'paymentStatus': paymentStatus,
      'paymentId': paymentId,
      'status': status,
      'statusHistory': statusHistory.map((h) => h.toJson()).toList(),
      'notes': notes,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}
