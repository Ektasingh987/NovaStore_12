import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'constants/app_constants.dart';
import 'constants/app_theme.dart';
import 'navigation/app_router.dart';
import 'providers/core_providers.dart';
import 'providers/theme_provider.dart';
import 'services/storage_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize environment and storage concurrently to minimize cold start delay
  final results = await Future.wait([
    dotenv.load(fileName: '.env').catchError((e) {
      debugPrint('dotenv notice: $e');
    }),
    StorageService.init(),
  ]);

  final storageService = results[1] as StorageService;

  runApp(
    ProviderScope(
      overrides: [
        storageServiceProvider.overrideWithValue(storageService),
      ],
      child: const NovaStoreApp(),
    ),
  );
}

class NovaStoreApp extends ConsumerWidget {
  const NovaStoreApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(goRouterProvider);
    final themeMode = ref.watch(themeProvider);

    return MaterialApp.router(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
