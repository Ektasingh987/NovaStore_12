import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/app_constants.dart';

class StorageService {
  final FlutterSecureStorage _secureStorage;
  final SharedPreferences _prefs;

  StorageService({
    required FlutterSecureStorage secureStorage,
    required SharedPreferences prefs,
  })  : _secureStorage = secureStorage,
        _prefs = prefs;

  // Factory initializer
  static Future<StorageService> init() async {
    const secureStorage = FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
      iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
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
}
