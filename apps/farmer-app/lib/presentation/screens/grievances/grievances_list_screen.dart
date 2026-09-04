import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/grievance.dart';
import '../../../state/grievance_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/demo_badge.dart';
import '../../widgets/network_state_views.dart';
import '../../widgets/status_chip.dart';
import 'raise_grievance_screen.dart';

class GrievancesListScreen extends StatelessWidget {
  const GrievancesListScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final grievanceState = context.watch<GrievanceProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l10n.grievancesTitle,
          style: AppTypography.headlineLarge.copyWith(fontWeight: FontWeight.w800),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16.0),
            child: DemoBadge(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => grievanceState.loadGrievances(),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.s16),
              child: AppButton(
                label: l10n.raiseGrievanceCta,
                icon: Icons.add_circle_outline,
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const RaiseGrievanceScreen()),
                  );
                },
              ),
            ),
            Expanded(
              child: grievanceState.isLoading
                  ? const LoadingStateView()
                  : grievanceState.grievances.isEmpty
                      ? EmptyStateView(
                          title: 'No Grievances Raised',
                          description: 'If you ever encounter payment delays, weighing issues or logistics troubles, you can file a formal complaint here.',
                          onAction: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => const RaiseGrievanceScreen()),
                            );
                          },
                          actionLabel: l10n.raiseGrievanceCta,
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s16),
                          itemCount: grievanceState.grievances.length,
                          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.s12),
                          itemBuilder: (context, index) {
                            final grievance = grievanceState.grievances[index];
                            return _buildGrievanceCard(context, grievance);
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGrievanceCard(BuildContext context, Grievance grievance) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'TICKET #${grievance.id.substring(0, 8).toUpperCase()}',
                style: AppTypography.labelSmall.copyWith(fontWeight: FontWeight.w800, color: AppColors.textTertiary),
              ),
              StatusChip(status: grievance.status),
            ],
          ),
          const SizedBox(height: AppSpacing.s8),
          Text(
            grievance.categoryDisplayName,
            style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: AppSpacing.s4),
          Text(
            grievance.description,
            style: AppTypography.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.s12),
          if (grievance.resolution != null) ...[
            Container(
              padding: const EdgeInsets.all(AppSpacing.s10),
              decoration: BoxDecoration(
                color: AppColors.successContainer,
                borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_outline, color: AppColors.success, size: 18),
                  const SizedBox(width: AppSpacing.s8),
                  Expanded(
                    child: Text(
                      'Resolution: ${grievance.resolution}',
                      style: AppTypography.bodyMedium.copyWith(color: AppColors.success, fontWeight: FontWeight.w600, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.s8),
          ],
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (grievance.orderId != null)
                Text(
                  'Order: #${grievance.orderId!.substring(0, 8)}',
                  style: AppTypography.labelSmall.copyWith(color: AppColors.primary),
                ),
              Text(
                'Raised on ${DateFormatter.formatDate(grievance.createdAt)}',
                style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
