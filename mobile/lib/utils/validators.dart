class Validators {
  static String? requiredField(String? value, [String fieldName = 'This field']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  static String? name(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Name is required';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (value.trim().length > 100) {
      return 'Name cannot exceed 100 characters';
    }
    return null;
  }

  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Email is required';
    }
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    if (!emailRegex.hasMatch(value.trim())) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    final hasUppercase = value.contains(RegExp(r'[A-Z]'));
    final hasLowercase = value.contains(RegExp(r'[a-z]'));
    final hasDigit = value.contains(RegExp(r'[0-9]'));

    if (!hasUppercase || !hasLowercase || !hasDigit) {
      return 'Must include uppercase, lowercase, and a number';
    }
    return null;
  }

  static String? loginPassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    return null;
  }

  static String? phone(String? value, {bool isOptional = false}) {
    if (value == null || value.trim().isEmpty) {
      if (isOptional) return null;
      return 'Phone number is required';
    }
    final phoneRegex = RegExp(r'^\+?[0-9\s\-().]{7,20}$');
    if (!phoneRegex.hasMatch(value.trim())) {
      return 'Please enter a valid phone number';
    }
    return null;
  }

  static String? addressLine(String? value, {String label = 'Address line'}) {
    if (value == null || value.trim().isEmpty) {
      return '$label is required';
    }
    if (value.trim().length < 3) {
      return '$label must be at least 3 characters';
    }
    return null;
  }

  static String? city(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'City is required';
    }
    if (value.trim().length < 2) {
      return 'City must be at least 2 characters';
    }
    return null;
  }

  static String? state(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'State is required';
    }
    if (value.trim().length < 2) {
      return 'State must be at least 2 characters';
    }
    return null;
  }

  static String? postalCode(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Postal code is required';
    }
    if (value.trim().length < 3 || value.trim().length > 20) {
      return 'Please enter a valid postal code (3-20 digits)';
    }
    return null;
  }
}
