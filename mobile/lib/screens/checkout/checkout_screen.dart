import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../constants/app_colors.dart';
import '../../models/order_model.dart';
import '../../navigation/routes.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/core_providers.dart';
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

  List<DeliveryAddressModel> _savedAddresses = [];
  int _selectedAddressIndex = 0;
  bool _isAddingNewAddress = false;
  bool _saveForFuture = true;

  String _selectedPaymentMethod = 'COD';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadSavedAddresses();
    });
  }

  void _loadSavedAddresses() {
    final storage = ref.read(storageServiceProvider);
    final saved = storage.getSavedDeliveryAddresses();
    setState(() {
      _savedAddresses = saved;
      if (_savedAddresses.isNotEmpty) {
        _isAddingNewAddress = false;
        _selectedAddressIndex = 0;
      } else {
        _isAddingNewAddress = true;
        final user = ref.read(authProvider).user;
        if (user != null) {
          _nameController.text = user.name;
          if (user.phone != null) {
            _phoneController.text = user.phone!;
          }
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
    final cart = ref.read(cartProvider).cart;
    if (cart.items.isEmpty) {
      SnackbarUtils.showError(context, 'Your cart is empty');
      return;
    }

    late final DeliveryAddressModel address;

    if (!_isAddingNewAddress && _savedAddresses.isNotEmpty) {
      address = _savedAddresses[_selectedAddressIndex];
      // Move to top of most recently used
      await ref.read(storageServiceProvider).saveDeliveryAddress(address);
    } else {
      if (!_formKey.currentState!.validate()) {
        SnackbarUtils.showError(
            context, 'Please complete all required delivery address fields');
        return;
      }

      address = DeliveryAddressModel(
        fullName: _nameController.text.trim(),
        phone: _phoneController.text.trim(),
        line1: _line1Controller.text.trim(),
        line2: _line2Controller.text.trim(),
        city: _cityController.text.trim(),
        state: _stateController.text.trim(),
        postalCode: _pincodeController.text.trim(),
        country: 'India',
      );

      if (_saveForFuture) {
        await ref.read(storageServiceProvider).saveDeliveryAddress(address);
      }
    }

    final order = await ref.read(ordersProvider.notifier).createOrder(
          address: address,
          paymentMethod: _selectedPaymentMethod,
          notes: _notesController.text.trim().isNotEmpty
              ? _notesController.text.trim()
              : null,
        );

    if (mounted) {
      if (order != null) {
        SnackbarUtils.showSuccess(context, 'Order placed successfully!');
        context.go(AppRoutes.orderConfirmationPath(order.id));
      } else {
        final error =
            ref.read(ordersProvider).error ?? 'Failed to place order';
        SnackbarUtils.showError(context, error);
      }
    }
  }

  void _confirmDeleteAddress(int index) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: const Text('Delete Saved Address'),
        content: const Text('Are you sure you want to remove this address?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await ref
                  .read(storageServiceProvider)
                  .removeSavedDeliveryAddress(index);
              _loadSavedAddresses();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
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
              // ─── 1. Delivery Address Section ─────────────────────────────
              Row(
                children: [
                  Expanded(
                    child: _buildSectionHeader(
                        '1. Delivery Address', Icons.location_on_outlined, isDark),
                  ),
                  const SizedBox(width: 8),
                  if (_savedAddresses.isNotEmpty)
                    InkWell(
                      onTap: () {
                        setState(() {
                          _isAddingNewAddress = !_isAddingNewAddress;
                        });
                      },
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              _isAddingNewAddress
                                  ? Icons.bookmark_rounded
                                  : Icons.add_rounded,
                              size: 15,
                              color: AppColors.primary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              _isAddingNewAddress ? 'Saved' : 'Add New',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),

              // Saved Addresses Selector OR Add New Address Form
              if (!_isAddingNewAddress && _savedAddresses.isNotEmpty) ...[
                // List of Saved Addresses
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _savedAddresses.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final address = _savedAddresses[index];
                    final isSelected = _selectedAddressIndex == index;
                    return _buildSavedAddressCard(
                        index, address, isSelected, isDark);
                  },
                ),
                const SizedBox(height: 14),

                // Button to add new address
                OutlinedButton.icon(
                  onPressed: () {
                    setState(() {
                      _isAddingNewAddress = true;
                    });
                  },
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: const Text('Add Another Delivery Address'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                        vertical: 12, horizontal: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    side: BorderSide(
                      color: isDark
                          ? AppColors.borderDark
                          : AppColors.primary.withValues(alpha: 0.5),
                    ),
                  ),
                ),
              ] else ...[
                // New Address Form
                if (_savedAddresses.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.2),
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.info_outline,
                            color: AppColors.primary, size: 18),
                        const SizedBox(width: 8),
                        const Expanded(
                          child: Text(
                            'Entering a new address. It will be saved for future orders.',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        InkWell(
                          onTap: () =>
                              setState(() => _isAddingNewAddress = false),
                          child: const Padding(
                            padding: EdgeInsets.all(4),
                            child: Text(
                              'Cancel',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                decoration: TextDecoration.underline,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                CustomTextField(
                  controller: _nameController,
                  label: 'Full Name *',
                  hintText: 'John Doe',
                  validator: Validators.name,
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _phoneController,
                  label: 'Phone Number (10 digits) *',
                  hintText: '9876543210',
                  keyboardType: TextInputType.phone,
                  maxLength: 10,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(10),
                  ],
                  validator: (val) => Validators.phone(val),
                ),
                const SizedBox(height: 14),

                CustomTextField(
                  controller: _line1Controller,
                  label: 'House / Flat No., Building, Street *',
                  hintText: '123 Cyber Towers, Main Road',
                  validator: (val) =>
                      Validators.addressLine(val, label: 'Address line 1'),
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
                const SizedBox(height: 10),

                // Save for future checkbox
                Row(
                  children: [
                    Checkbox(
                      value: _saveForFuture,
                      activeColor: AppColors.primary,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4)),
                      onChanged: (val) {
                        setState(() {
                          _saveForFuture = val ?? true;
                        });
                      },
                    ),
                    const Expanded(
                      child: Text(
                        'Save this address for fast checkout next time',
                        style: TextStyle(fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 28),

              // ─── 2. Payment Method Section ─────────────────────────────
              _buildSectionHeader(
                  '2. Payment Method', Icons.payment_outlined, isDark),
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

              // ─── 3. Additional Notes ───────────────────────────────────
              _buildSectionHeader(
                  '3. Order Notes (Optional)', Icons.edit_note_outlined, isDark),
              const SizedBox(height: 12),
              CustomTextField(
                controller: _notesController,
                hintText:
                    'Special instructions for delivery (e.g. Leave with security)',
                maxLines: 2,
              ),
              const SizedBox(height: 28),

              // ─── 4. Order Summary Card ─────────────────────────────────
              _buildSectionHeader(
                  '4. Order Summary', Icons.receipt_long_outlined, isDark),
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
                    _buildOrderSummaryRow(
                        'Items Count', '${cart.totalItems} items', isDark),
                    const SizedBox(height: 8),
                    _buildOrderSummaryRow(
                        'Subtotal',
                        CurrencyFormatter.format(cart.calculatedSubtotal),
                        isDark),
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
                      cart.calculatedDeliveryCharge == 0
                          ? 'FREE'
                          : CurrencyFormatter.format(
                              cart.calculatedDeliveryCharge),
                      isDark,
                      valueColor: cart.calculatedDeliveryCharge == 0
                          ? AppColors.success
                          : null,
                    ),
                    const SizedBox(height: 12),
                    Divider(
                        color: isDark
                            ? AppColors.borderDark
                            : AppColors.borderLight),
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

              // ─── Place Order Button ────────────────────────────────────
              CustomButton(
                text:
                    'Place Order (${CurrencyFormatter.format(cart.calculatedTotal)})',
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

  Widget _buildSavedAddressCard(
    int index,
    DeliveryAddressModel address,
    bool isSelected,
    bool isDark,
  ) {
    return InkWell(
      onTap: () => setState(() => _selectedAddressIndex = index),
      borderRadius: BorderRadius.circular(16),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isDark ? AppColors.cardDark : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : (isDark ? AppColors.borderDark : AppColors.borderLight),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? AppColors.primary.withValues(alpha: 0.12)
                  : Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Radio Indicator
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected
                          ? AppColors.primary
                          : (isDark ? Colors.grey.shade600 : Colors.grey.shade400),
                      width: 2,
                    ),
                  ),
                  child: isSelected
                      ? Center(
                          child: Container(
                            width: 12,
                            height: 12,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: AppColors.primary,
                            ),
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: 10),

                // Full Name
                Expanded(
                  child: Text(
                    address.fullName,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                    ),
                  ),
                ),

                // Tag
                if (index == 0)
                  Container(
                    margin: const EdgeInsets.only(right: 6),
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text(
                      'Default',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ),

                // Delete Address Button
                IconButton(
                  icon: const Icon(Icons.delete_outline_rounded, size: 18),
                  color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  splashRadius: 18,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: () => _confirmDeleteAddress(index),
                ),
              ],
            ),
            const SizedBox(height: 6),

            // Phone
            Padding(
              padding: const EdgeInsets.only(left: 32),
              child: Row(
                children: [
                  Icon(
                    Icons.phone_outlined,
                    size: 13,
                    color: isDark
                        ? AppColors.textTertiaryDark
                        : AppColors.textTertiaryLight,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    address.phone,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: isDark
                          ? AppColors.textSecondaryDark
                          : AppColors.textSecondaryLight,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 6),

            // Street & Location
            Padding(
              padding: const EdgeInsets.only(left: 32),
              child: Text(
                address.formattedAddress,
                style: TextStyle(
                  fontSize: 13,
                  height: 1.35,
                  color: isDark
                      ? AppColors.textSecondaryDark
                      : AppColors.textSecondaryLight,
                ),
              ),
            ),

            if (isSelected) ...[
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.only(left: 32),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_rounded,
                        size: 14, color: AppColors.success),
                    const SizedBox(width: 4),
                    Text(
                      'Delivering to this address',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.success,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, bool isDark) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Flexible(
          child: Text(
            title,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color:
                  isDark ? AppColors.textPrimaryDark : AppColors.textPrimaryLight,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
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
                    ? AppColors.primary.withValues(alpha: 0.12)
                    : (isDark ? AppColors.surfaceDark : Colors.grey.shade100),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                icon,
                color: isSelected
                    ? AppColors.primary
                    : (isDark
                        ? AppColors.textSecondaryDark
                        : AppColors.textSecondaryLight),
                size: 24,
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
                      color: isDark
                          ? AppColors.textPrimaryDark
                          : AppColors.textPrimaryLight,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: isDark
                          ? AppColors.textTertiaryDark
                          : AppColors.textTertiaryLight,
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
    Color? valueColor,
    bool isBold = false,
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
                ? (isDark
                    ? AppColors.textPrimaryDark
                    : AppColors.textPrimaryLight)
                : (isDark
                    ? AppColors.textSecondaryDark
                    : AppColors.textSecondaryLight),
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: isBold ? 16 : 13,
            fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
            color: valueColor ??
                (isBold
                    ? AppColors.primary
                    : (isDark
                        ? AppColors.textPrimaryDark
                        : AppColors.textPrimaryLight)),
          ),
        ),
      ],
    );
  }
}
