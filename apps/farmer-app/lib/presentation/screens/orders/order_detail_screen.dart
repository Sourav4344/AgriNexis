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
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/demo_badge.dart';
import '../../widgets/status_chip.dart';
import '../grievances/raise_grievance_screen.dart';

class OrderDetailScreen extends StatefulWidget {
  final Order order;

  const OrderDetailScreen({Key? key, required this.order}) : super(key: key);

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrderProvider>().loadHistoryForOrder(widget.order.id);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final orderState = context.watch<OrderProvider>();
    final history = orderState.getHistory(widget.order.id);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Order #${widget.order.id.substring(0, 8).toUpperCase()}',
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
          // Order Status Header
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      widget.order.buyerName ?? 'DEMO Buyer B',
                      style: AppTypography.headlineMedium.copyWith(fontWeight: FontWeight.w700),
                    ),
                    StatusChip(status: widget.order.status),
                  ],
                ),
                const SizedBox(height: AppSpacing.s8),
                Text(
                  'Crop: ${widget.order.cropName ?? "Tomato (टमाटर)"}',
                  style: AppTypography.bodyMedium,
                ),
                Text(
                  'Accepted At: ${DateFormatter.formatDateTime(widget.order.acceptedAt)}',
                  style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s16),

          // Immutable Financial Snapshot Box
          AppCard(
            backgroundColor: AppColors.surface,
            border: const BorderSide(color: AppColors.primary, width: 1.5),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.lock_outline, color: AppColors.primary, size: 20),
                    const SizedBox(width: AppSpacing.s8),
                    Text(
                      l10n.orderFinancialSnapshot,
                      style: AppTypography.headlineMedium.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s4),
                Text(
                  'Protected from tampering. Immutable agreed financial values.',
                  style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
                ),
                const SizedBox(height: AppSpacing.s12),
                const Divider(),
                const SizedBox(height: AppSpacing.s8),
                _buildRow(
                  'Accepted Gross Selling Value',
                  '${CurrencyFormatter.formatRate(widget.order.snapshot.unitPricePerKg)} × ${CurrencyFormatter.formatQuantity(widget.order.snapshot.quantityKg)} = ${CurrencyFormatter.format(widget.order.snapshot.grossSellingValue)}',
                ),
                _buildRow(
                  '— Transportation Cost',
                  '— ${CurrencyFormatter.format(widget.order.snapshot.transportationCost)}',
                  isDeduction: true,
                ),
                _buildRow(
                  '— Storage Cost',
                  '— ${CurrencyFormatter.format(widget.order.snapshot.storageCost)}',
                  isDeduction: true,
                ),
                _buildRow(
                  '— Handling / Labor Cost',
                  '— ${CurrencyFormatter.format(widget.order.snapshot.handlingCost)}',
                  isDeduction: true,
                ),
                _buildRow(
                  '— Other Applicable Costs',
                  '— ${CurrencyFormatter.format(widget.order.snapshot.otherApplicableCost)}',
                  isDeduction: true,
                ),
                const Divider(),
                _buildRow(
                  'Total Cost Deductions',
                  '— ${CurrencyFormatter.format(widget.order.snapshot.totalApplicableCost)}',
                  isBold: true,
                  isDeduction: true,
                ),
                const Divider(),
                _buildRow(
                  'Net Farmer Realization (NFR)',
                  CurrencyFormatter.format(widget.order.snapshot.netFarmerRealization),
                  isBold: true,
                  isPrimary: true,
                ),
                const SizedBox(height: AppSpacing.s8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s8, vertical: AppSpacing.s4),
                  decoration: BoxDecoration(
                    color: AppColors.successContainer,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.verified, size: 16, color: AppColors.success),
                      const SizedBox(width: AppSpacing.s4),
                      Text(
                        'Payment Status: ${widget.order.paymentStatus}',
                        style: AppTypography.labelSmall.copyWith(
                          color: AppColors.success,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s16),

          // Order Status Timeline
          AppCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(l10n.orderTimelineTitle, style: AppTypography.headlineMedium),
                const SizedBox(height: AppSpacing.s12),
                if (history.isEmpty)
                  _buildTimelineItem('CONFIRMED', 'Offer accepted & snapshot created', widget.order.acceptedAt, isFirst: true, isLast: true)
                else
                  ...history.asMap().entries.map((entry) {
                    final idx = entry.key;
                    final item = entry.value;
                    return _buildTimelineItem(
                      item.toStatus,
                      item.reason ?? 'Status transitioned by ${item.actor ?? "system"}',
                      item.changedAt,
                      isFirst: idx == 0,
                      isLast: idx == history.length - 1,
                    );
                  }),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s24),

          // Grievance / Support Button
          AppButton(
            label: 'Have an issue with this Order? Raise Grievance',
            variant: AppButtonVariant.outlined,
            icon: Icons.report_problem_outlined,
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => RaiseGrievanceScreen(orderId: widget.order.id),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildTimelineItem(String status, String description, DateTime timestamp, {bool isFirst = false, bool isLast = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 16,
              height: 16,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 36,
                color: AppColors.primaryLight,
              ),
          ],
        ),
        const SizedBox(width: AppSpacing.s12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  StatusChip(status: status),
                  Text(DateFormatter.formatTime(timestamp), style: AppTypography.labelSmall),
                ],
              ),
              const SizedBox(height: AppSpacing.s2),
              Text(description, style: AppTypography.bodyMedium),
              const SizedBox(height: AppSpacing.s12),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRow(String label, String value, {bool isBold = false, bool isDeduction = false, bool isPrimary = false}) {
    Color valColor = AppColors.textPrimary;
    if (isDeduction) valColor = AppColors.costDeduction;
    if (isPrimary) valColor = AppColors.primary;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: AppTypography.bodyMedium.copyWith(
              color: AppColors.textSecondary,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w400,
            ),
          ),
          Flexible(
            child: Text(
              value,
              style: AppTypography.bodyLarge.copyWith(
                fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
                color: valColor,
              ),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}
