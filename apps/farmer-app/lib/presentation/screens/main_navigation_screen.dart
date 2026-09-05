import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../state/app_state_provider.dart';
import '../widgets/bottom_nav_bar.dart';
import '../widgets/demo_badge.dart';
import 'home/home_screen.dart';
import 'markets/market_discovery_screen.dart';
import 'orders/orders_list_screen.dart';
import 'profile/profile_screen.dart';
import 'sell/sell_produce_wizard_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({Key? key}) : super(key: key);

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  final List<Widget> _screens = const [
    HomeScreen(),
    MarketDiscoveryScreen(),
    SellProduceWizardScreen(),
    OrdersListScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppStateProvider>();

    return Scaffold(
      body: Column(
        children: [
          const DemoBadge(isBanner: true),
          Expanded(
            child: IndexedStack(
              index: appState.selectedNavIndex,
              children: _screens,
            ),
          ),
        ],
      ),
      bottomNavigationBar: FarmerBottomNavBar(
        currentIndex: appState.selectedNavIndex,
        onTap: (index) => appState.setNavIndex(index),
      ),
    );
  }
}
