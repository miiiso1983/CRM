import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/constants.dart';
import 'dashboard/dashboard_screen.dart';
import 'leads/leads_screen.dart';
import 'meetings/meetings_screen.dart';
import 'notifications/notifications_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _currentIndex = 0;

  List<Widget> _getScreens(AuthProvider auth) {
    final screens = [
      const DashboardScreen(),
      const LeadsScreen(),
    ];
    if (!auth.isSales) {
      screens.add(const MeetingsScreen());
    }
    screens.add(const NotificationsScreen());
    return screens;
  }

  List<BottomNavigationBarItem> _getNavItems(AuthProvider auth) {
    final items = [
      const BottomNavigationBarItem(
        icon: Icon(Icons.dashboard_outlined),
        activeIcon: Icon(Icons.dashboard),
        label: 'الرئيسية',
      ),
      const BottomNavigationBarItem(
        icon: Icon(Icons.people_outline),
        activeIcon: Icon(Icons.people),
        label: 'العملاء',
      ),
    ];
    if (!auth.isSales) {
      items.add(const BottomNavigationBarItem(
        icon: Icon(Icons.event_outlined),
        activeIcon: Icon(Icons.event),
        label: 'الاجتماعات',
      ));
    }
    items.add(const BottomNavigationBarItem(
      icon: Icon(Icons.notifications_outlined),
      activeIcon: Icon(Icons.notifications),
      label: 'الإشعارات',
    ));
    return items;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final screens = _getScreens(auth);
    final navItems = _getNavItems(auth);

    // Ensure index is within bounds
    if (_currentIndex >= screens.length) {
      _currentIndex = 0;
    }

    return Directionality(
      textDirection: TextDirection.rtl,
      child: Scaffold(
        appBar: AppBar(
          title: const Text(
            'Al Team CRM',
            style: TextStyle(
              fontFamily: 'Cairo',
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          flexibleSpace: Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(kPrimaryBlue), Color(kPrimaryPurple)],
              ),
            ),
          ),
          actions: [
            Padding(
              padding: const EdgeInsets.only(left: 8),
              child: PopupMenuButton(
                icon: CircleAvatar(
                  backgroundColor: Colors.white.withOpacity(0.2),
                  child: Text(
                    auth.user?.name.substring(0, 1) ?? '?',
                    style: const TextStyle(
                        color: Colors.white, fontFamily: 'Cairo'),
                  ),
                ),
                itemBuilder: (_) => <PopupMenuEntry>[
                  PopupMenuItem<void>(
                    enabled: false,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(auth.user?.name ?? '',
                            style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontFamily: 'Cairo')),
                        Text(auth.user?.role?.nameAr ?? '',
                            style: TextStyle(
                                color: Colors.grey[600],
                                fontSize: 12,
                                fontFamily: 'Cairo')),
                      ],
                    ),
                  ),
                  const PopupMenuDivider(),
                  PopupMenuItem<void>(
                    onTap: () => auth.logout(),
                    child: const Row(
                      children: [
                        Icon(Icons.logout, color: Colors.red),
                        SizedBox(width: 8),
                        Text('تسجيل الخروج',
                            style: TextStyle(
                                color: Colors.red, fontFamily: 'Cairo')),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        body: IndexedStack(
          index: _currentIndex,
          children: screens,
        ),
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          type: BottomNavigationBarType.fixed,
          selectedItemColor: const Color(kPrimaryBlue),
          unselectedItemColor: Colors.grey,
          selectedLabelStyle:
              const TextStyle(fontFamily: 'Cairo', fontSize: 11),
          unselectedLabelStyle:
              const TextStyle(fontFamily: 'Cairo', fontSize: 11),
          items: navItems,
        ),
      ),
    );
  }
}

