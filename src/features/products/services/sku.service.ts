/* eslint-disable prettier/prettier */
import { BadRequestException, Injectable } from '@nestjs/common';
import { ProductVariantLength } from '../entities/Product.entity';

const ALLOWED_LENGTHS = Object.values(ProductVariantLength);

@Injectable()
export class SkuService {
  /**
   * Generate SKU from item name, thickness, color, and length
   * Format: [ItemName]-[Thickness]-[Color]-[Length]
   * Example: D10-1.2mm-DULL-12ft becomes D10-1.2-DUL-12FT
   */
  generateSku(
    itemName: string,
    thickness: string,
    color: string,
    length: string,
  ): string {
    const normalizedLength = String(length ?? '').trim();
    if (!ALLOWED_LENGTHS.includes(normalizedLength as ProductVariantLength)) {
      throw new BadRequestException(
        `Invalid length '${normalizedLength}'. Allowed lengths are: ${ALLOWED_LENGTHS.join(', ')}`,
      );
    }

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

    return `${cleanItemName}-${cleanThickness}-${cleanColor}-${normalizedLength}`;
  }

  /**
   * Validate SKU format
   */
  isValidSku(sku: string): boolean {
    // Basic format validation: ITEM-THICKNESS-COLOR-LENGTH
    const skuPattern = /^[A-Z0-9]+-[0-9.]+-[A-Z]{3}-[A-Z0-9.]+(?:-[0-9]+)?$/;
    return skuPattern.test(sku);
  }

  /**
   * Generate unique SKU with collision handling
   */
  generateUniqueSku(
    itemName: string,
    thickness: string,
    color: string,
    length: string,
    existingSkus: string[],
  ): string {
    const baseSku = this.generateSku(itemName, thickness, color, length);
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
