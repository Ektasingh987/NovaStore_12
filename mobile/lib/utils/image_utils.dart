import 'package:flutter/foundation.dart';
import '../constants/app_constants.dart';

class ImageUtils {
  static String resolveUrl(String? url) {
    if (url == null || url.trim().isEmpty) return '';
    var cleanUrl = url.trim();

    // If running on Android and URL contains localhost:5000, swap to 10.0.2.2:5000
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      if (cleanUrl.contains('localhost:5000')) {
        cleanUrl = cleanUrl.replaceAll('localhost:5000', '10.0.2.2:5000');
      } else if (cleanUrl.contains('127.0.0.1:5000')) {
        cleanUrl = cleanUrl.replaceAll('127.0.0.1:5000', '10.0.2.2:5000');
      }
    }

    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      return cleanUrl;
    }

    final baseUrl = AppConstants.defaultBaseUrl;
    if (cleanUrl.startsWith('/')) {
      return '$baseUrl$cleanUrl';
    }
    return '$baseUrl/$cleanUrl';
  }
}
