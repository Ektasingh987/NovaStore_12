import 'package:intl/intl.dart';
import '../constants/app_constants.dart';

class CurrencyFormatter {
  static final NumberFormat _formatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '${AppConstants.currencySymbol} ',
    decimalDigits: 2,
  );

  static final NumberFormat _compactFormatter = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '${AppConstants.currencySymbol} ',
    decimalDigits: 0,
  );

  static String format(num? amount) {
    if (amount == null) return '${AppConstants.currencySymbol} 0.00';
    return _formatter.format(amount);
  }

  static String formatCompact(num? amount) {
    if (amount == null) return '${AppConstants.currencySymbol} 0';
    if (amount % 1 == 0) {
      return _compactFormatter.format(amount);
    }
    return _formatter.format(amount);
  }
}
