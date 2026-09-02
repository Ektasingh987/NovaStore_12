import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';
import '../models/order_model.dart';

class StorageService {
  final FlutterSecureStorage _secureStorage;
  final SharedPreferences _prefs;

  StorageService({
    required FlutterSecureStorage secureStorage,
    required SharedPreferences prefs,
  })  : _secureStorage = secureStorage,
        _prefs = prefs;

  // Factory initializer with optimized start-up options
  static Future<StorageService> init() async {
    const secureStorage = FlutterSecureStorage(
      aOptions: AndroidOptions(
        encryptedSharedPreferences: false,
        resetOnError: true,
      ),
      iOptions: IOSOptions(
        accessibility: KeychainAccessibility.first_unlock,
      ),
    );
    final prefs = await SharedPreferences.getInstance();
    return StorageService(secureStorage: secureStorage, prefs: prefs);
  }

  // Refresh Token (Secure Storage)
  Future<void> saveRefreshToken(String token) async {
    await _secureStorage.write(key: AppConstants.keyRefreshToken, value: token);
  }

  Future<String?> getRefreshToken() async {
    return await _secureStorage.read(key: AppConstants.keyRefreshToken);
  }

  Future<void> clearRefreshToken() async {
    await _secureStorage.delete(key: AppConstants.keyRefreshToken);
  }

  // General clear on logout
  Future<void> clearAuthData() async {
    await _secureStorage.delete(key: AppConstants.keyRefreshToken);
  }

  // Theme preference (Light / Dark / System)
  Future<void> saveThemeMode(String mode) async {
    await _prefs.setString(AppConstants.keyThemeMode, mode);
  }

  String? getThemeMode() {
    return _prefs.getString(AppConstants.keyThemeMode);
  }

  // Recent Searches
  Future<void> saveRecentSearches(List<String> searches) async {
    await _prefs.setStringList(AppConstants.keyRecentSearches, searches);
  }

  List<String> getRecentSearches() {
    return _prefs.getStringList(AppConstants.keyRecentSearches) ?? [];
  }

  // Saved Delivery Addresses
  Future<void> saveDeliveryAddress(DeliveryAddressModel address) async {
    final list = getSavedDeliveryAddresses();
    // Remove if identical recipient and address exists to avoid duplicates
    list.removeWhere((a) =>
        a.fullName.trim().toLowerCase() == address.fullName.trim().toLowerCase() &&
        a.line1.trim().toLowerCase() == address.line1.trim().toLowerCase() &&
        a.postalCode.trim() == address.postalCode.trim());
    // Insert at front as most recently used
    list.insert(0, address);
    if (list.length > 10) {
      list.removeLast();
    }
    final jsonList = list.map((a) => jsonEncode(a.toJson())).toList();
    await _prefs.setStringList(AppConstants.keySavedAddresses, jsonList);
  }

  List<DeliveryAddressModel> getSavedDeliveryAddresses() {
    final raw = _prefs.getStringList(AppConstants.keySavedAddresses) ?? [];
    final addresses = <DeliveryAddressModel>[];
    for (final str in raw) {
      try {
        final map = jsonDecode(str) as Map<String, dynamic>;
        addresses.add(DeliveryAddressModel.fromJson(map));
      } catch (_) {}
    }
    return addresses;
  }

  Future<void> removeSavedDeliveryAddress(int index) async {
    final list = getSavedDeliveryAddresses();
    if (index >= 0 && index < list.length) {
      list.removeAt(index);
      final jsonList = list.map((a) => jsonEncode(a.toJson())).toList();
      await _prefs.setStringList(AppConstants.keySavedAddresses, jsonList);
    }
  }
}
