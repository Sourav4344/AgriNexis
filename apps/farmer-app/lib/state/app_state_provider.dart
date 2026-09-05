import 'package:flutter/material.dart';

class AppStateProvider extends ChangeNotifier {
  Locale _currentLocale = const Locale('en'); // Default English, with instant Hindi ('hi') and Marathi ('mr') toggle
  bool _isOffline = false;
  int _selectedNavIndex = 0;

  Locale get currentLocale => _currentLocale;
  String get languageCode => _currentLocale.languageCode;
  bool get isOffline => _isOffline;
  int get selectedNavIndex => _selectedNavIndex;

  void setLocale(Locale locale) {
    if (_currentLocale != locale) {
      _currentLocale = locale;
      notifyListeners();
    }
  }

  void setLanguageCode(String code) {
    if (['en', 'hi', 'mr'].contains(code)) {
      _currentLocale = Locale(code);
      notifyListeners();
    }
  }

  void setOfflineState(bool offline) {
    if (_isOffline != offline) {
      _isOffline = offline;
      notifyListeners();
    }
  }

  void setNavIndex(int index) {
    if (_selectedNavIndex != index) {
      _selectedNavIndex = index;
      notifyListeners();
    }
  }
}
