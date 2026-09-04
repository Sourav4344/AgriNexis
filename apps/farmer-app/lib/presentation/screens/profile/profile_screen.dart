import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../l10n/app_localizations.dart';
import '../../../state/app_state_provider.dart';
import '../../../state/auth_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/demo_badge.dart';
import '../../widgets/status_chip.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final auth = context.watch<AuthProvider>();
    final appState = context.watch<AppStateProvider>();
    final profile = auth.profile;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l10n.farmerProfileTitle,
          style: AppTypography.headlineLarge.copyWith(fontWeight: FontWeight.w800),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: DemoBadge(),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.s16),
        children: [
          // Profile Header
          AppCard(
            child: Row(
              children: [
                CircleAvatar(
                  radius: 32,
                  backgroundColor: AppColors.primaryContainer,
                  child: const Icon(Icons.person, size: 36, color: AppColors.primary),
                ),
                const SizedBox(width: AppSpacing.s16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profile?.displayName ?? 'Rahul',
                        style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const SizedBox(height: AppSpacing.s2),
                      Text(
                        'Role: ${profile?.role ?? "FARMER"} • ${profile?.district ?? "Pune"}, ${profile?.state ?? "Maharashtra"}',
                        style: AppTypography.bodyMedium,
                      ),
                      const SizedBox(height: AppSpacing.s6),
                      StatusChip(status: profile?.status ?? 'ACTIVE'),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s20),

          // Language Selector
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.languageSelectionTitle, style: AppTypography.headlineMedium),
                const SizedBox(height: AppSpacing.s12),
                _buildLanguageOption(
                  context: context,
                  title: 'हिंदी (Hindi)',
                  code: 'hi',
                  isSelected: appState.languageCode == 'hi',
                ),
                const Divider(),
                _buildLanguageOption(
                  context: context,
                  title: 'English',
                  code: 'en',
                  isSelected: appState.languageCode == 'en',
                ),
                const Divider(),
                _buildLanguageOption(
                  context: context,
                  title: 'मराठी (Marathi)',
                  code: 'mr',
                  isSelected: appState.languageCode == 'mr',
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s20),

          // Farm & Geography Summary
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.farmSummaryTitle, style: AppTypography.headlineMedium),
                const SizedBox(height: AppSpacing.s12),
                _buildProfileRow('District', profile?.district ?? 'Pune'),
                _buildProfileRow('State', profile?.state ?? 'Maharashtra'),
                _buildProfileRow('Postal Area', profile?.postalArea ?? 'DEMO-AREA'),
                _buildProfileRow('Farm Summary', profile?.farmSummary ?? 'DEMO farmer profile (Tomato & Onion cultivation)'),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s20),

          // Security & Trust Notice
          Container(
            padding: const EdgeInsets.all(AppSpacing.s16),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.security, size: 20, color: AppColors.primary),
                    const SizedBox(width: AppSpacing.s8),
                    Text(
                      'AgriNexis Trust & Security',
                      style: AppTypography.labelLarge.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s8),
                Text(
                  'Your financial transactions are protected by immutable server-side snapshots. Precise farm coordinates are never disclosed to non-participating buyers.',
                  style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
                ),
                const SizedBox(height: AppSpacing.s12),
                Text(
                  '${AppConstants.appName} • ${AppConstants.sihProblemStatement}',
                  style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w700),
                ),
                Text(
                  AppConstants.appTagline,
                  style: AppTypography.labelSmall.copyWith(fontStyle: FontStyle.italic),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s32),
        ],
      ),
    );
  }

  Widget _buildLanguageOption({
    required BuildContext context,
    required String title,
    required String code,
    required bool isSelected,
  }) {
    return InkWell(
      onTap: () {
        context.read<AppStateProvider>().setLanguageCode(code);
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.s8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              title,
              style: AppTypography.bodyLarge.copyWith(
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                color: isSelected ? AppColors.primary : AppColors.textPrimary,
              ),
            ),
            if (isSelected)
              const Icon(Icons.check_circle, color: AppColors.primary, size: 20)
            else
              const Icon(Icons.radio_button_unchecked, color: AppColors.border, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
          Flexible(
            child: Text(
              value,
              style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}
