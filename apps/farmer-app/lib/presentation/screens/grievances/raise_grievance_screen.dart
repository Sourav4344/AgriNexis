import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../l10n/app_localizations.dart';
import '../../../state/grievance_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';

class RaiseGrievanceScreen extends StatefulWidget {
  final String? orderId;

  const RaiseGrievanceScreen({Key? key, this.orderId}) : super(key: key);

  @override
  State<RaiseGrievanceScreen> createState() => _RaiseGrievanceScreenState();
}

class _RaiseGrievanceScreenState extends State<RaiseGrievanceScreen> {
  String _selectedCategory = 'PAYMENT_DELAY';
  final TextEditingController _descController = TextEditingController();

  final List<Map<String, String>> _categories = [
    {'code': 'PAYMENT_DELAY', 'label': 'Payment Delay (भुगतान में देरी)'},
    {'code': 'LOGISTICS_ISSUE', 'label': 'Logistics & Pickup Delay (परिवहन / वाहन देरी)'},
    {'code': 'QUALITY_DISPUTE', 'label': 'Quality Dispute (गुणवत्ता व ग्रेडिंग विवाद)'},
    {'code': 'WEIGHMENT_MISMATCH', 'label': 'Weight Discrepancy (वजन में अंतर)'},
    {'code': 'OTHER', 'label': 'Other Operational Concern (अन्य समस्या)'},
  ];

  @override
  void dispose() {
    _descController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final grievanceState = context.watch<GrievanceProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l10n.raiseGrievanceCta,
          style: AppTypography.headlineLarge.copyWith(fontWeight: FontWeight.w800),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.s16),
        children: [
          if (widget.orderId != null) ...[
            Container(
              padding: const EdgeInsets.all(AppSpacing.s12),
              decoration: BoxDecoration(
                color: AppColors.primaryContainer,
                borderRadius: BorderRadius.circular(AppSpacing.radiusSmall),
              ),
              child: Row(
                children: [
                  const Icon(Icons.link, color: AppColors.primary, size: 20),
                  const SizedBox(width: AppSpacing.s8),
                  Text(
                    'Referenced Order: #${widget.orderId!.substring(0, 8)}',
                    style: AppTypography.labelMedium.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.s16),
          ],

          Text(l10n.grievanceCategoryLabel, style: AppTypography.headlineMedium),
          const SizedBox(height: AppSpacing.s8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
              border: Border.all(color: AppColors.border),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                isExpanded: true,
                value: _selectedCategory,
                items: _categories.map((c) {
                  return DropdownMenuItem<String>(
                    value: c['code'],
                    child: Text(c['label']!, style: AppTypography.bodyLarge),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _selectedCategory = val);
                },
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.s20),

          AppTextField(
            controller: _descController,
            label: l10n.grievanceDescriptionLabel,
            hint: 'Describe what happened (e.g. driver pickup time, weight scales, or bank transfer delay)...',
            maxLines: 5,
          ),
          const SizedBox(height: AppSpacing.s24),

          AppButton(
            label: l10n.submitGrievanceButton,
            icon: Icons.send,
            isLoading: grievanceState.isSubmitting,
            onPressed: () async {
              if (_descController.text.trim().isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Please enter a description for your grievance.')),
                );
                return;
              }

              final result = await grievanceState.submitGrievance(
                category: _selectedCategory,
                description: _descController.text.trim(),
                orderId: widget.orderId,
              );

              if (context.mounted && result != null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: AppColors.success,
                    content: Text(l10n.grievanceSubmittedSuccess),
                  ),
                );
                Navigator.pop(context);
              }
            },
          ),
        ],
      ),
    );
  }
}
