import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_colors.dart';
import '../../models/order_model.dart';
import '../../navigation/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/orders_provider.dart';
import '../../utils/currency_formatter.dart';
import '../../utils/snackbar_utils.dart';
import '../../utils/validators.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_text_field.dart';

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _line1Controller = TextEditingController();
  final _line2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _notesController = TextEditingController();

  String _selectedPaymentMethod = 'COD';

  @override
  void initState() {
    super.initState();
    // Prefill user details if available
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(authProvider).user;
      if (user != null) {
        _nameController.text = user.name;
        if (user.phone != null) {
          _phoneController.text = user.phone!;
        }
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _line1Controller.dispose();
    _line2Controller.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handlePlaceOrder() async {
    if (!_formKey.currentState!.validate()) {
      SnackbarUtils.showError(context, 'Please complete all required delivery address fields');
      return;
    }

    final cart = ref.read(cartProvider).cart;
    if (cart.items.isEmpty) {
      SnackbarUtils.showError(context, 'Your cart is empty');
      return;
    }

    final address = DeliveryAddressModel(
      fullName: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      line1: _line1Controller.text.trim(),
      line2: _line2Controller.text.trim(),
      city: _cityController.text.trim(),
      state: _stateController.text.trim(),
      postalCode: _pincodeController.text.trim(),
      country: 'India',
    );

    final order = await ref.read(ordersProvider.notifier).createOrder(
          address: address,
          paymentMethod: _selectedPaymentMethod,
          notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
        );

    if (mounted) {
      if (order != null) {
        SnackbarUtils.showSuccess(context, 'Order placed successfully!');
        context.go(AppRoutes.orderConfirmationPath(order.id));
      } else {
        final error = ref.read(ordersProvider).error ?? 'Failed to place order';
        SnackbarUtils.showError(context, error);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cartState = ref.watch(cartProvider);
    final ordersState = ref.watch(ordersProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final cart = cartState.cart;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Delivery Address Section
              _buildSectionHeader('1. Delivery Address', Icons.location_on_outlined, isDark),
              const SizedBox(height: 16),

              CustomTextField(
                controller: _nameController,
                label: 'Full Name *',
                hintText: 'John Doe',
                validator: Validators.name,
              ),
              const SizedBox(height: 14),

              CustomTextField(
                controller: _phoneController,
                label: 'Phone Number *',
                hintText: '+91 9876543210',
                keyboardType: TextInputType.phone,
                validator: (val) => Validators.phone(val),
              ),
              const SizedBox(height: 14),

              CustomTextField(
                controller: _line1Controller,
                label: 'House / Flat No., Building, Street *',
                hintText: '123 Cyber Towers, Main Road',
                validator: (val) => Validators.addressLine(val, label: 'Address line 1'),
              ),
              const SizedBox(height: 14),

              CustomTextField(
                controller: _line2Controller,
                label: 'Landmark / Area (Optional)',
                hintText: 'Near City Mall',
              ),
              const SizedBox(height: 14),

              Row(
                children: [
                  Expanded(
                    child: CustomTextField(
                      controller: _cityController,
                      label: 'City *',
                      hintText: 'Mumbai',
                      validator: Validators.city,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: CustomTextField(
                      controller: _stateController,
                      label: 'State *',
                      hintText: 'Maharashtra',
                      validator: Validators.state,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              CustomTextField(
                controller: _pincodeController,
                label: 'Pincode / Postal Code *',
                hintText: '400001',
                keyboardType: TextInputType.number,
                validator: Validators.postalCode,
              ),
              const SizedBox(height: 28),

              // Payment Method Section
              _buildSectionHeader('2. Payment Method', Icons.payment_outlined, isDark),
              const SizedBox(height: 16),

              _buildPaymentOption(
                title: 'Cash on Delivery (COD)',
                subtitle: 'Pay with cash upon package arrival',
                value: 'COD',
                icon: Icons.money_rounded,
                isDark: isDark,
              ),
              const SizedBox(height: 10),

              _buildPaymentOption(
                title: 'UPI / Google Pay / PhonePe',
                subtitle: 'Instant and secure payment with UPI apps',
                value: 'UPI',
                icon: Icons.account_balance_wallet_outlined,
                isDark: isDark,
              ),
              const SizedBox(height: 10),

              _buildPaymentOption(
                title: 'Credit / Debit Card / Razorpay',
                subtitle: 'Visa, Mastercard, RuPay & all major banks',
                value: 'Razorpay',
                icon: Icons.credit_card_rounded,
                isDark: isDark,
              ),
              const SizedBox(height: 28),

              // Additional Notes
              _buildSectionHeader('3. Order Notes (Optional)', Icons.edit_note_outlined, isDark),
              const SizedBox(height: 12),
              CustomTextField(
                controller: _notesController,
                hintText: 'Special instructions for delivery (e.g. Leave with security)',
                maxLines: 2,
              ),
              const SizedBox(height: 28),

              // Order Summary Card
              _buildSectionHeader('4. Order Summary', Icons.receipt_long_outlined, isDark),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? AppColors.surfaceDark : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                  ),
                ),
                child: Column(
                  children: [
                    _buildOrderSummaryRow('Items Count', '${cart.totalItems} items', isDark),
                    const SizedBox(height: 8),
                    _buildOrderSummaryRow('Subtotal', CurrencyFormatter.format(cart.calculatedSubtotal), isDark),
                    if (cart.calculatedDiscount > 0) ...[
                      const SizedBox(height: 8),
                      _buildOrderSummaryRow(
                        'Discount',
                        '- ${CurrencyFormatter.format(cart.calculatedDiscount)}',
                        isDark,
                        valueColor: AppColors.success,
                      ),
                    ],
                    const SizedBox(height: 8),
                    _buildOrderSummaryRow(
                      'Delivery',
                      cart.calculatedDeliveryCharge == 0 ? 'FREE' : CurrencyFormatter.format(cart.calculatedDeliveryCharge),
                      isDark,
                      valueColor: cart.calculatedDeliveryCharge == 0 ? AppColors.success : null,
                    ),
                    const SizedBox(height: 12),
                    Divider(color: isDark ? AppColors.borderDark : AppColors.borderLight),
                    const SizedBox(height: 12),
                    _buildOrderSummaryRow(
                      'Total to Pay',
                      CurrencyFormatter.format(cart.calculatedTotal),
                      isDark,
                      isBold: true,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Place Order Button
              CustomButton(
                text: 'Place Order (${CurrencyFormatter.format(cart.calculatedTotal)})',
                onPressed: _handlePlaceOrder,
                isLoading: ordersState.isPlacingOrder,
                icon: const Icon(Icons.check_circle_outline, color: Colors.white),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, bool isDark) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentOption({
    required String title,
    required String subtitle,
    required String value,
    required IconData icon,
    required bool isDark,
  }) {
    final isSelected = _selectedPaymentMethod == value;

    return InkWell(
      onTap: () => setState(() => _selectedPaymentMethod = value),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : (isDark ? AppColors.borderDark : AppColors.borderLight),
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.primary.withOpacity(0.12)
                    : (isDark ? AppColors.surfaceDark : Colors.grey.shade100),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: isSelected ? AppColors.primary : Colors.grey.shade600,
                size: 22,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),
            Radio<String>(
              value: value,
              groupValue: _selectedPaymentMethod,
              activeColor: AppColors.primary,
              onChanged: (val) {
                if (val != null) setState(() => _selectedPaymentMethod = val);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSummaryRow(
    String label,
    String value,
    bool isDark, {
    bool isBold = false,
    Color? valueColor,
  }) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: isBold ? 15 : 13,
            fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
            color: isBold
                ? (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight)
                : (isDark ? AppColors.textSecondaryDark : AppColors.textSecondaryLight),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isBold ? 18 : 13,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
            color: valueColor ??
                (isBold
                    ? (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight)
                    : (isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight)),
          ),
        ),
      ],
    );
  }
}
