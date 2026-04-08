import 'dotenv/config';
import mongoose, { Model } from 'mongoose';
import { Product, productSchema } from '../entities/Product.entity';

const MONGO_URI = process.env.MONGO_URI;
const DEFAULT_LENGTH = '14';

type VariantLike = {
  length?: unknown;
};

function needsDefaultLength(variant: VariantLike): boolean {
  if (!variant || typeof variant !== 'object') {
    return true;
  }

  const value = variant.length;
  if (typeof value !== 'string') {
    return true;
  }

  return value.trim() === '';
}

async function migrateVariantLength() {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI is required to run migrateVariantLength');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);

  const ProductModel: Model<Product> = mongoose.model<Product>(
    Product.name,
    productSchema,
  );

  const products = await ProductModel.find({}, { variants: 1 }).lean().exec();

  let updatedProducts = 0;
  let updatedVariants = 0;

  const bulkOps = products
    .map((product) => {
      const variants = Array.isArray(product.variants) ? product.variants : [];
      let changedInProduct = 0;

      const nextVariants = variants.map((variant) => {
        if (needsDefaultLength(variant as VariantLike)) {
          changedInProduct += 1;
          return {
            ...variant,
            length: DEFAULT_LENGTH,
          };
        }

        return variant;
      });

      if (changedInProduct === 0) {
        return null;
      }

      updatedProducts += 1;
      updatedVariants += changedInProduct;

      return {
        updateOne: {
          filter: { _id: product._id },
          update: { $set: { variants: nextVariants } },
        },
      };
    })
    .filter(Boolean);

  if (bulkOps.length === 0) {
    console.log('No products required migration.');
    await mongoose.connection.close();
    return;
  }

  await ProductModel.bulkWrite(
    bulkOps as Array<{
      updateOne: {
        filter: { _id: unknown };
        update: { $set: { variants: unknown[] } };
      };
    }>,
  );

  console.log(
    `Migration complete. Updated ${updatedProducts} product(s) and ${updatedVariants} variant(s).`,
  );

  await mongoose.connection.close();
}

void migrateVariantLength().catch((error) => {
  console.error('Variant length migration failed:', error);
  void mongoose.connection.close();
  process.exit(1);
});
