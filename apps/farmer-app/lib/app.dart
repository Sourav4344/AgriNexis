import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'l10n/app_localizations.dart';
import 'presentation/screens/main_navigation_screen.dart';
import 'state/app_state_provider.dart';

class AgriNexisFarmerApp extends StatelessWidget {
  const AgriNexisFarmerApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();

    return MaterialApp(
      title: 'AgriNexis Farmer',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      locale: appState.currentLocale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: const MainNavigationScreen(),
    );
  }
}
