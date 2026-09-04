class Crop {
  final String id;
  final String canonicalCode;
  final String nameEn;
  final String nameHi;
  final String nameBn;
  final String defaultUnit;
  final bool active;

  Crop({
    required this.id,
    required this.canonicalCode,
    required this.nameEn,
    required this.nameHi,
    required this.nameBn,
    this.defaultUnit = 'kg',
    this.active = true,
  });

  factory Crop.fromJson(Map<String, dynamic> json) {
    return Crop(
      id: json['id'] as String,
      canonicalCode: json['canonical_code'] as String? ?? '',
      nameEn: json['name_en'] as String? ?? '',
      nameHi: json['name_hi'] as String? ?? json['name_en'] as String? ?? '',
      nameBn: json['name_bn'] as String? ?? json['name_en'] as String? ?? '',
      defaultUnit: json['default_unit'] as String? ?? 'kg',
      active: json['active'] as bool? ?? true,
    );
  }

  String localizedName(String localeCode) {
    if (localeCode.startsWith('hi')) return nameHi.isNotEmpty ? nameHi : nameEn;
    if (localeCode.startsWith('bn') || localeCode.startsWith('mr')) return nameHi.isNotEmpty ? nameHi : nameEn;
    return nameEn;
  }
}

class CropVariety {
  final String id;
  final String cropId;
  final String canonicalName;
  final String nameEn;
  final String? nameHi;
  final String? nameBn;

  CropVariety({
    required this.id,
    required this.cropId,
    required this.canonicalName,
    required this.nameEn,
    this.nameHi,
    this.nameBn,
  });

  factory CropVariety.fromJson(Map<String, dynamic> json) {
    return CropVariety(
      id: json['id'] as String,
      cropId: json['crop_id'] as String? ?? '',
      canonicalName: json['canonical_name'] as String? ?? '',
      nameEn: json['name_en'] as String? ?? json['canonical_name'] as String? ?? '',
      nameHi: json['name_hi'] as String?,
      nameBn: json['name_bn'] as String?,
    );
  }

  String localizedName(String localeCode) {
    if (localeCode.startsWith('hi') && nameHi != null && nameHi!.isNotEmpty) {
      return nameHi!;
    }
    return nameEn;
  }
}
