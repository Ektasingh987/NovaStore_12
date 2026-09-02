import 'package:flutter/material.dart';

class RatingStars extends StatelessWidget {
  final double rating;
  final int? reviewCount;
  final double starSize;
  final bool showNumber;
  final TextStyle? textStyle;

  const RatingStars({
    super.key,
    required this.rating,
    this.reviewCount,
    this.starSize = 14,
    this.showNumber = true,
    this.textStyle,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Icon(
          Icons.star_rounded,
          color: const Color(0xFFF59E0B),
          size: starSize,
        ),
        const SizedBox(width: 4),
        if (showNumber)
          Text(
            rating.toStringAsFixed(1),
            style: textStyle ??
                const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
          ),
        if (reviewCount != null) ...[
          const SizedBox(width: 4),
          Text(
            '($reviewCount)',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ],
    );
  }
}
