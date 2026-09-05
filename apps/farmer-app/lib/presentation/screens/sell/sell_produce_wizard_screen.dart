import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/utils/currency_formatter.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../l10n/app_localizations.dart';
import '../../../models/crop.dart';
import '../../../models/produce_listing.dart';
import '../../../state/auth_provider.dart';
import '../../../state/listing_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_card.dart';
import '../../widgets/app_text_field.dart';
import 'listing_detail_screen.dart';

class SellProduceWizardScreen extends StatefulWidget {
  const SellProduceWizardScreen({Key? key}) : super(key: key);

  @override
  State<SellProduceWizardScreen> createState() => _SellProduceWizardScreenState();
}

class _SellProduceWizardScreenState extends State<SellProduceWizardScreen> {
  int _currentStep = 0;

  // Form Fields
  Crop? _selectedCrop;
  CropVariety? _selectedVariety;
  final TextEditingController _quantityController = TextEditingController(text: '1000');
  DateTime _harvestDate = DateTime.now().subtract(const Duration(days: 2));
  DateTime _availableFrom = DateTime.now();
  DateTime _availableUntil = DateTime.now().add(const Duration(days: 5));
  String _declaredGrade = 'A';
  final TextEditingController _districtController = TextEditingController(text: 'Pune');
  final TextEditingController _stateController = TextEditingController(text: 'Maharashtra');
  final TextEditingController _postalAreaController = TextEditingController(text: 'DEMO-AREA');
  bool _photoAdded = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final listingState = context.read<ListingProvider>();
      if (listingState.crops.isNotEmpty) {
        setState(() {
          _selectedCrop = listingState.crops.first;
        });
        listingState.loadVarietiesForCrop(_selectedCrop!.id);
      }
    });
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _districtController.dispose();
    _stateController.dispose();
    _postalAreaController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final listingState = context.watch<ListingProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          l10n.createListingTitle,
          style: AppTypography.headlineLarge.copyWith(fontWeight: FontWeight.w800),
        ),
      ),
      body: Column(
        children: [
          // Step Progress Indicator
          Container(
            color: AppColors.surface,
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s16, vertical: AppSpacing.s12),
            child: Row(
              children: [
                _buildStepBadge(0, l10n.stepCrop),
                _buildStepDivider(0),
                _buildStepBadge(1, l10n.stepDetails),
                _buildStepDivider(1),
                _buildStepBadge(2, l10n.stepQuality),
                _buildStepDivider(2),
                _buildStepBadge(3, l10n.stepReview),
              ],
            ),
          ),
          const Divider(height: 1),

          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.s16),
              children: [
                if (_currentStep == 0) _buildStep0Crop(listingState, l10n),
                if (_currentStep == 1) _buildStep1Details(l10n),
                if (_currentStep == 2) _buildStep2Quality(l10n),
                if (_currentStep == 3) _buildStep3Review(l10n, listingState),
              ],
            ),
          ),

          // Bottom Action Bar
          Container(
            padding: const EdgeInsets.all(AppSpacing.s16),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: Row(
              children: [
                if (_currentStep > 0) ...[
                  Expanded(
                    flex: 1,
                    child: AppButton(
                      label: 'Back',
                      variant: AppButtonVariant.outlined,
                      onPressed: () => setState(() => _currentStep--),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s12),
                ],
                Expanded(
                  flex: 2,
                  child: AppButton(
                    label: _currentStep == 3 ? l10n.publishListingCta : 'Next Step',
                    isLoading: listingState.isLoading,
                    onPressed: () => _handleNext(listingState, l10n),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep0Crop(ListingProvider listingState, AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.selectCropLabel, style: AppTypography.headlineMedium),
        const SizedBox(height: AppSpacing.s12),
        Wrap(
          spacing: AppSpacing.s12,
          runSpacing: AppSpacing.s12,
          children: listingState.crops.map((crop) {
            final isSelected = _selectedCrop?.id == crop.id;
            return GestureDetector(
              onTap: () {
                setState(() {
                  _selectedCrop = crop;
                });
                listingState.loadVarietiesForCrop(crop.id);
              },
              child: Container(
                width: 155,
                padding: const EdgeInsets.all(AppSpacing.s16),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primaryContainer : AppColors.surface,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : AppColors.border,
                    width: isSelected ? 2.0 : 1.0,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      Icons.eco,
                      size: 36,
                      color: isSelected ? AppColors.primary : AppColors.textSecondary,
                    ),
                    const SizedBox(height: AppSpacing.s8),
                    Text(
                      crop.localizedName('hi'),
                      style: AppTypography.headlineMedium.copyWith(
                        fontSize: 16,
                        color: isSelected ? AppColors.primary : AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    Text(
                      crop.nameEn,
                      style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: AppSpacing.s24),

        if (listingState.varieties.isNotEmpty) ...[
          Text(l10n.selectVarietyLabel, style: AppTypography.headlineMedium),
          const SizedBox(height: AppSpacing.s12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s12),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
              border: Border.all(color: AppColors.border),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<CropVariety>(
                isExpanded: true,
                value: _selectedVariety ?? listingState.varieties.first,
                items: listingState.varieties.map((v) {
                  return DropdownMenuItem<CropVariety>(
                    value: v,
                    child: Text(
                      '${v.nameEn} (${v.nameHi ?? v.canonicalName})',
                      style: AppTypography.bodyLarge,
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  setState(() => _selectedVariety = val);
                },
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildStep1Details(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AppTextField(
          controller: _quantityController,
          label: l10n.quantityLabel,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          suffixText: 'kg',
          helperText: 'e.g. 1000 kg (10 quintals / 1 tonne)',
        ),
        const SizedBox(height: AppSpacing.s16),

        _buildDateTile(
          label: l10n.harvestDateLabel,
          date: _harvestDate,
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _harvestDate,
              firstDate: DateTime.now().subtract(const Duration(days: 30)),
              lastDate: DateTime.now(),
            );
            if (picked != null) setState(() => _harvestDate = picked);
          },
        ),
        const SizedBox(height: AppSpacing.s16),

        Row(
          children: [
            Expanded(
              child: _buildDateTile(
                label: l10n.availableFromLabel,
                date: _availableFrom,
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _availableFrom,
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 60)),
                  );
                  if (picked != null) setState(() => _availableFrom = picked);
                },
              ),
            ),
            const SizedBox(width: AppSpacing.s12),
            Expanded(
              child: _buildDateTile(
                label: l10n.availableUntilLabel,
                date: _availableUntil,
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _availableUntil,
                    firstDate: _availableFrom,
                    lastDate: _availableFrom.add(const Duration(days: 30)),
                  );
                  if (picked != null) setState(() => _availableUntil = picked);
                },
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.s20),

        Text(l10n.locationDetailsTitle, style: AppTypography.headlineMedium),
        const SizedBox(height: AppSpacing.s12),
        Row(
          children: [
            Expanded(
              child: AppTextField(
                controller: _districtController,
                label: l10n.districtLabel,
              ),
            ),
            const SizedBox(width: AppSpacing.s12),
            Expanded(
              child: AppTextField(
                controller: _stateController,
                label: l10n.stateLabel,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.s12),
        AppTextField(
          controller: _postalAreaController,
          label: l10n.postalAreaLabel,
        ),
      ],
    );
  }

  Widget _buildStep2Quality(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.declaredGradeLabel, style: AppTypography.headlineMedium),
        const SizedBox(height: AppSpacing.s12),
        Row(
          children: ['A', 'B', 'C'].map((grade) {
            final isSelected = _declaredGrade == grade;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4.0),
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    backgroundColor: isSelected ? AppColors.primaryContainer : AppColors.surface,
                    side: BorderSide(
                      color: isSelected ? AppColors.primary : AppColors.border,
                      width: isSelected ? 2.0 : 1.0,
                    ),
                    padding: const EdgeInsets.symmetric(vertical: AppSpacing.s16),
                  ),
                  onPressed: () => setState(() => _declaredGrade = grade),
                  child: Column(
                    children: [
                      Text(
                        'Grade $grade',
                        style: AppTypography.headlineMedium.copyWith(
                          color: isSelected ? AppColors.primary : AppColors.textPrimary,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Text(
                        grade == 'A' ? 'Premium' : (grade == 'B' ? 'Standard' : 'Fair'),
                        style: AppTypography.labelSmall,
                      ),
                    ],
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: AppSpacing.s24),

        // Photo Upload Placeholder for Visual Quality AI
        Text('Visual Crop Quality Photo (Optional)', style: AppTypography.headlineMedium),
        const SizedBox(height: AppSpacing.s4),
        Text(
          'Assistive visual assessment for buyers. Not a lab-grade or food safety certification.',
          style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary),
        ),
        const SizedBox(height: AppSpacing.s8),
        GestureDetector(
          onTap: () {
            setState(() => _photoAdded = !_photoAdded);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  _photoAdded
                      ? 'Crop photo attached (Advisory visual assessment: Grade A)'
                      : 'Photo removed.',
                ),
                duration: const Duration(seconds: 2),
              ),
            );
          },
          child: Container(
            width: double.infinity,
            height: 140,
            decoration: BoxDecoration(
              color: _photoAdded ? AppColors.successContainer : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
              border: Border.all(
                color: _photoAdded ? AppColors.success : AppColors.border,
                width: 1.5,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  _photoAdded ? Icons.check_circle : Icons.camera_alt_outlined,
                  size: 40,
                  color: _photoAdded ? AppColors.success : AppColors.primary,
                ),
                const SizedBox(height: AppSpacing.s8),
                Text(
                  _photoAdded
                      ? 'Visual Quality Sample Attached (Advisory Grade A - 92%)'
                      : l10n.uploadPhotoPlaceholder,
                  style: AppTypography.labelLarge.copyWith(
                    color: _photoAdded ? AppColors.success : AppColors.textPrimary,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
                if (_photoAdded) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Advisory only • Final grading subject to physical inspection',
                    style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary, fontSize: 10),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildStep3Review(AppLocalizations l10n, ListingProvider listingState) {
    final qty = double.tryParse(_quantityController.text) ?? 1000.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(l10n.reviewAndPublish, style: AppTypography.headlineMedium),
        const SizedBox(height: AppSpacing.s12),
        AppCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildReviewRow('Crop', '${_selectedCrop?.nameEn ?? "Tomato"} (${_selectedCrop?.nameHi ?? "टमाटर"})'),
              const Divider(),
              _buildReviewRow('Variety', _selectedVariety?.nameEn ?? 'Desi / Standard Red'),
              const Divider(),
              _buildReviewRow('Total Quantity', CurrencyFormatter.formatQuantity(qty)),
              const Divider(),
              _buildReviewRow('Quality Grade', 'Grade $_declaredGrade (${_photoAdded ? "AI Verified" : "Self-declared"})'),
              const Divider(),
              _buildReviewRow('Harvest Date', DateFormatter.formatDate(_harvestDate)),
              const Divider(),
              _buildReviewRow('Availability', '${DateFormatter.formatDate(_availableFrom)} to ${DateFormatter.formatDate(_availableUntil)}'),
              const Divider(),
              _buildReviewRow('Farm Location', '${_districtController.text}, ${_stateController.text} (${_postalAreaController.text})'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReviewRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.s8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: AppTypography.bodyMedium.copyWith(color: AppColors.textSecondary)),
          Flexible(
            child: Text(
              value,
              style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w700),
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDateTile({
    required String label,
    required DateTime date,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.s12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMedium),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTypography.labelSmall.copyWith(color: AppColors.textSecondary)),
            const SizedBox(height: AppSpacing.s4),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  DateFormatter.formatDate(date),
                  style: AppTypography.bodyLarge.copyWith(fontWeight: FontWeight.w600),
                ),
                const Icon(Icons.calendar_today, size: 18, color: AppColors.primary),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepBadge(int stepIndex, String title) {
    final isActive = _currentStep == stepIndex;
    final isDone = _currentStep > stepIndex;

    return Row(
      children: [
        Container(
          width: 26,
          height: 26,
          decoration: BoxDecoration(
            color: isDone ? AppColors.primary : (isActive ? AppColors.primaryContainer : AppColors.surfaceVariant),
            shape: BoxShape.circle,
            border: Border.all(
              color: isActive || isDone ? AppColors.primary : AppColors.border,
            ),
          ),
          child: Center(
            child: isDone
                ? const Icon(Icons.check, size: 16, color: Colors.white)
                : Text(
                    '${stepIndex + 1}',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isActive ? AppColors.primary : AppColors.textSecondary,
                    ),
                  ),
          ),
        ),
        const SizedBox(width: AppSpacing.s4),
        Text(
          title,
          style: AppTypography.labelSmall.copyWith(
            fontWeight: isActive ? FontWeight.w800 : FontWeight.w500,
            color: isActive ? AppColors.primary : AppColors.textSecondary,
          ),
        ),
      ],
    );
  }

  Widget _buildStepDivider(int stepIndex) {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
        color: _currentStep > stepIndex ? AppColors.primary : AppColors.border,
      ),
    );
  }

  void _handleNext(ListingProvider listingState, AppLocalizations l10n) async {
    if (_currentStep < 3) {
      setState(() => _currentStep++);
    } else {
      final auth = context.read<AuthProvider>();
      final qty = double.tryParse(_quantityController.text) ?? 1000.0;

      final newListing = ProduceListing(
        id: AppConstants.demoListingId,
        farmerProfileId: auth.profile?.id ?? AppConstants.demoFarmerId,
        cropId: _selectedCrop?.id ?? '30000000-0000-4000-8000-000000000001',
        varietyId: _selectedVariety?.id ?? '31000000-0000-4000-8000-000000000001',
        quantity: qty,
        availableQuantity: qty,
        unit: 'kg',
        harvestDate: _harvestDate,
        availableFrom: _availableFrom,
        availableUntil: _availableUntil,
        district: _districtController.text,
        state: _stateController.text,
        postalArea: _postalAreaController.text,
        qualitySummary: QualitySummary(
          declaredGrade: _declaredGrade,
          demoLabel: 'DEMO DATA',
        ),
        status: 'ACTIVE',
        cropName: _selectedCrop?.localizedName('hi') ?? 'Tomato (टमाटर)',
        varietyName: _selectedVariety?.nameEn ?? 'Desi / Standard Red',
      );

      final created = await listingState.createListing(newListing);
      if (mounted && created != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: AppColors.success,
            content: Text(l10n.listingCreatedSuccess),
          ),
        );
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => ListingDetailScreen(listing: created)),
        );
      }
    }
  }
}
