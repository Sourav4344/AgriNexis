import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/order.dart';
import '../../../state/order_provider.dart';
import '../../widgets/app_card.dart';
import '../../widgets/demo_badge.dart';
import '../../widgets/network_state_views.dart';
import '../../widgets/status_chip.dart';
import 'order_detail_screen.dart';

class OrdersListScreen extends StatelessWidget {
  const OrdersListScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final orderState = context.watch<OrderProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l10n.navOrders,
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
        onRefresh: () => orderState.loadOrders(),
        child: orderState.isLoading
            ? const LoadingStateView()
            : orderState.orders.isEmpty
                ? EmptyStateView(
                    title: 'No Orders Yet',
                    description: 'Accepted buyer offers will automatically transition into active fulfillment orders.',
                    onAction: () => orderState.loadOrders(),
                    actionLabel: l10n.retry,
                  )
                : ListView.separated(
                    padding: const EdgeInsets.all(AppSpacing.s16),
                    itemCount: orderState.orders.length,
                    separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.s12),
                    itemBuilder: (context, index) {
                      final order = orderState.orders[index];
                      return _buildOrderCard(context, order);
                    },
                  ),
      ),
    );
  }

  Widget _buildOrderCard(BuildContext context, Order order) {
    return AppCard(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => OrderDetailScreen(order: order)),
        );
      },
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ORDER #${order.id.substring(0, 8).toUpperCase()}',
                style: AppTypography.labelSmall.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppColors.textTertiary,
                ),
              ),
              StatusChip(status: order.status),
            ],
          ),
          const SizedBox(height: AppSpacing.s8),

          Text(
            order.buyerName ?? 'DEMO Buyer B',
            style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: AppSpacing.s4),
          Text(
            '${order.cropName ?? "Tomato (टमाटर)"} • ${CurrencyFormatter.formatQuantity(order.snapshot.quantityKg)}',
            style: AppTypography.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.s12),

          Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s12, vertical: AppSpacing.s8),
            decoration: BoxDecoration(
              color: AppColors.primaryContainer,
              borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Agreed Net Payout (NFR)', style: AppTypography.labelSmall),
                    Text(
                      CurrencyFormatter.format(order.snapshot.netFarmerRealization),
                      style: AppTypography.headlineMedium.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
                StatusChip(status: order.paymentStatus, customLabel: 'PAYMENT: ${order.paymentStatus}'),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s8),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Accepted on ${DateFormatter.formatDate(order.acceptedAt)}',
                style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
              ),
              const Row(
                children: [
                  Text('View Details', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
                  Icon(Icons.chevron_right, size: 16, color: AppColors.primary),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
