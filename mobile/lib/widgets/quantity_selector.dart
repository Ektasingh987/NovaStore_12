import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class QuantitySelector extends StatelessWidget {
  final int quantity;
  final int maxStock;
  final ValueChanged<int> onChanged;
  final bool isCompact;

  const QuantitySelector({
    super.key,
    required this.quantity,
    required this.maxStock,
    required this.onChanged,
    this.isCompact = false,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final canDecrease = quantity > 1;
    final canIncrease = maxStock <= 0 || quantity < maxStock;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isCompact ? 4 : 8,
        vertical: isCompact ? 2 : 4,
      ),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.grey.shade100,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildButton(
            icon: Icons.remove,
            enabled: canDecrease,
            onTap: () => onChanged(quantity - 1),
            isDark: isDark,
          ),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: isCompact ? 8 : 14),
            child: Text(
              quantity.toString(),
              style: TextStyle(
                fontSize: isCompact ? 13 : 15,
                fontWeight: FontWeight.w700,
                color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
              ),
            ),
          ),
          _buildButton(
            icon: Icons.add,
            enabled: canIncrease,
            onTap: () => onChanged(quantity + 1),
            isDark: isDark,
          ),
        ],
      ),
    );
  }

  Widget _buildButton({
    required IconData icon,
    required bool enabled,
    required VoidCallback onTap,
    required bool isDark,
  }) {
    return InkWell(
      onTap: enabled ? onTap : null,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: EdgeInsets.all(isCompact ? 4 : 6),
        decoration: BoxDecoration(
          color: enabled
              ? (isDark ? AppColors.cardDark : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          boxShadow: enabled
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Icon(
          icon,
          size: isCompact ? 14 : 18,
          color: enabled
              ? (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight)
              : (isDark ? AppColors.textTertiaryDark : AppColors.textTertiaryLight),
        ),
      ),
    );
  }
}
