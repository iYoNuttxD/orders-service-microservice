/**
 * Money Value Object
 * Represents monetary values with proper precision
 */
class Money {
  constructor(amount, currency = 'BRL') {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Amount must be a non-negative number');
    }
    this.amount = Math.round(amount * 100) / 100; // Round to 2 decimal places
    this.currency = currency;
  }

  add(other) {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add money with different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  multiply(factor) {
    return new Money(this.amount * factor, this.currency);
  }

  equals(other) {
    return this.amount === other.amount && this.currency === other.currency;
  }

  getValue() {
    return this.amount;
  }

  toString() {
    return `${this.currency} ${this.amount.toFixed(2)}`;
  }

  toPrimitives() {
    return {
      amount: this.amount,
      currency: this.currency
    };
  }
}

module.exports = Money;
