import 'package:flutter_test/flutter_test.dart';
import 'package:ecommerce_mobile/models/product_model.dart';
import 'package:ecommerce_mobile/models/user_model.dart';
import 'package:ecommerce_mobile/utils/currency_formatter.dart';
import 'package:ecommerce_mobile/utils/validators.dart';

void main() {
  group('Unit Tests: Models & Validators', () {
    test('CurrencyFormatter formats amounts properly', () {
      expect(CurrencyFormatter.format(1299), '₹ 1,299.00');
      expect(CurrencyFormatter.formatCompact(499), '₹ 499');
    });

    test('Validators validate email and passwords', () {
      expect(Validators.email('test@example.com'), null);
      expect(Validators.email('invalid-email'), 'Please enter a valid email address');
      expect(Validators.password('Secret123'), null);
      expect(Validators.password('short'), 'Password must be at least 8 characters');
    });

    test('ProductModel calculates salePrice correctly with discount', () {
      final product = ProductModel(
        id: '123',
        name: 'Wireless Headphones',
        slug: 'wireless-headphones',
        price: 1000,
        discount: 20,
        rating: ProductRating(average: 4.5, count: 10),
      );

      expect(product.effectivePrice, 800.0);
    });

    test('UserModel role check works', () {
      final customer = UserModel(id: '1', name: 'Alice', email: 'alice@example.com', role: 'customer');
      final admin = UserModel(id: '2', name: 'Bob', email: 'bob@example.com', role: 'admin');

      expect(customer.isAdmin, false);
      expect(admin.isAdmin, true);
    });
  });
}
