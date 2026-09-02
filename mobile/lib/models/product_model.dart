import 'category_model.dart';

class ProductImage {
  final String url;
  final String? alt;
  final bool isPrimary;

  ProductImage({
    required this.url,
    this.alt,
    this.isPrimary = false,
  });

  factory ProductImage.fromJson(dynamic json) {
    if (json is String) {
      return ProductImage(url: json);
    }
    if (json is Map<String, dynamic>) {
      return ProductImage(
        url: (json['url'] ?? '') as String,
        alt: json['alt'] as String?,
        isPrimary: json['isPrimary'] as bool? ?? false,
      );
    }
    return ProductImage(url: '');
  }

  Map<String, dynamic> toJson() => {
    'url': url,
    'alt': alt,
    'isPrimary': isPrimary,
  };
}

class ProductRating {
  final double average;
  final int count;

  ProductRating({
    this.average = 0.0,
    this.count = 0,
  });

  factory ProductRating.fromJson(Map<String, dynamic>? json) {
    if (json == null) return ProductRating();
    return ProductRating(
      average: (json['average'] as num?)?.toDouble() ?? 0.0,
      count: json['count'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'average': average,
    'count': count,
  };
}

class ProductModel {
  final String id;
  final String name;
  final String slug;
  final String description;
  final double price;
  final double discount;
  final double? salePrice;
  final String? categoryId;
  final CategoryModel? category;
  final List<ProductImage> images;
  final int stock;
  final bool inStock;
  final ProductRating rating;
  final bool isFeatured;
  final bool isActive;
  final List<String> tags;
  final String? sku;
  final DateTime? createdAt;

  ProductModel({
    required this.id,
    required this.name,
    required this.slug,
    this.description = '',
    required this.price,
    this.discount = 0,
    this.salePrice,
    this.categoryId,
    this.category,
    this.images = const [],
    this.stock = 0,
    this.inStock = false,
    required this.rating,
    this.isFeatured = false,
    this.isActive = true,
    this.tags = const [],
    this.sku,
    this.createdAt,
  });

  double get effectivePrice {
    if (salePrice != null && salePrice! > 0) return salePrice!;
    if (discount > 0) {
      return double.parse((price * (1 - discount / 100)).toStringAsFixed(2));
    }
    return price;
  }

  String get primaryImageUrl {
    if (images.isEmpty) return '';
    final primary = images.firstWhere(
      (img) => img.isPrimary,
      orElse: () => images.first,
    );
    return primary.url;
  }

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    // Handle category as ID string or populated object
    String? catId;
    CategoryModel? catModel;

    if (json['category'] is Map<String, dynamic>) {
      catModel = CategoryModel.fromJson(json['category'] as Map<String, dynamic>);
      catId = catModel.id;
    } else if (json['category'] is String) {
      catId = json['category'] as String;
    }

    final rawImages = json['images'] as List<dynamic>? ?? [];
    final imageList = rawImages.map((img) => ProductImage.fromJson(img)).toList();

    final rawStock = json['stock'] as int? ?? 0;
    final inStockFlag = json['inStock'] as bool? ?? (rawStock > 0);

    return ProductModel(
      id: (json['_id'] ?? json['id'] ?? '') as String,
      name: (json['name'] ?? '') as String,
      slug: (json['slug'] ?? '') as String,
      description: (json['description'] ?? '') as String,
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      salePrice: (json['salePrice'] as num?)?.toDouble(),
      categoryId: catId,
      category: catModel,
      images: imageList,
      stock: rawStock,
      inStock: inStockFlag,
      rating: ProductRating.fromJson(json['rating'] as Map<String, dynamic>?),
      isFeatured: json['isFeatured'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      sku: json['sku'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      '_id': id,
      'name': name,
      'slug': slug,
      'description': description,
      'price': price,
      'discount': discount,
      'salePrice': salePrice,
      'category': category?.toJson() ?? categoryId,
      'images': images.map((i) => i.toJson()).toList(),
      'stock': stock,
      'inStock': inStock,
      'rating': rating.toJson(),
      'isFeatured': isFeatured,
      'isActive': isActive,
      'tags': tags,
      'sku': sku,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}
