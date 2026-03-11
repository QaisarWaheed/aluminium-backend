/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';

@Injectable()
export class SkuService {
  /**
   * Generate SKU from item name, thickness, and color
   * Format: [ItemName]-[Thickness]-[Color]
   * Example: D10-1.2mm-DULL becomes D10-1.2-DUL
   */
  generateSku(itemName: string, thickness: string, color: string): string {
    // Clean and format item name - remove spaces, special chars, uppercase
    const cleanItemName = itemName
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 10); // Max 10 chars

    // Clean thickness - remove 'mm', spaces, keep numbers and decimals
    const cleanThickness = thickness.replace(/[^0-9.]/g, '').substring(0, 6); // Max 6 chars (e.g., "1.25")

    // Clean color - remove spaces, special chars, take first 3 letters
    const cleanColor = color
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .substring(0, 3); // Max 3 chars

    return `${cleanItemName}-${cleanThickness}-${cleanColor}`;
  }

  /**
   * Validate SKU format
   */
  isValidSku(sku: string): boolean {
    // Basic format validation: XXX-X.X-XXX
    const skuPattern = /^[A-Z0-9]+-[0-9.]+[A-Z]{3}$/;
    return skuPattern.test(sku);
  }

  /**
   * Generate unique SKU with collision handling
   */
  generateUniqueSku(
    itemName: string,
    thickness: string,
    color: string,
    existingSkus: string[],
  ): string {
    const baseSku = this.generateSku(itemName, thickness, color);
    let uniqueSku = baseSku;
    let counter = 1;

    // Handle collisions by appending numbers
    while (existingSkus.includes(uniqueSku)) {
      uniqueSku = `${baseSku}-${counter}`;
      counter++;
    }

    return uniqueSku;
  }
}
