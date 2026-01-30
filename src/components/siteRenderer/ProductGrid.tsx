"use client";

import Image from "next/image";
import { ProductGridSection, ProductModel } from "@/lib/siteCompiler/types";

interface ProductGridProps {
  section: ProductGridSection;
}

export default function ProductGrid({ section }: ProductGridProps) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductGrid.tsx:10',message:'ProductGrid received section',data:{sectionType:section.type,hasProducts:!!section.products,productsIsArray:Array.isArray(section.products),productsLength:section.products?.length||0,firstProduct:section.products?.[0]?{id:section.products[0].id,name:section.products[0].name,hasImages:!!section.products[0].images,imagesLength:section.products[0].images?.length||0,firstImage:section.products[0].images?.[0]?{url:section.products[0].images[0].url,alt:section.products[0].images[0].alt}:null}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  // Safety check: ensure products array exists and is not empty
  if (!section.products || !Array.isArray(section.products) || section.products.length === 0) {
    console.warn("[ProductGrid] No products to display", { section });
    return null;
  }

  const gridCols =
    section.columns === 2
      ? "grid-cols-1 md:grid-cols-2"
      : section.columns === 4
      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {section.title && (
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            {section.title}
          </h2>
        )}
        <div className={`grid ${gridCols} gap-8`}>
          {section.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductCard({ product }: { product: ProductModel }) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/9a3b6649-09e2-46b1-ba72-7998690e9ef2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'ProductGrid.tsx:36',message:'ProductCard received product',data:{productId:product.id,productName:product.name,hasImages:!!product.images,imagesIsArray:Array.isArray(product.images),imagesLength:product.images?.length||0,firstImage:product.images?.[0]?{hasUrl:!!product.images[0].url,url:product.images[0].url,hasAlt:!!product.images[0].alt,alt:product.images[0].alt}:null,productShape:{hasId:!!product.id,hasName:!!product.name,hasDescription:!!product.description,hasPrice:!!product.price,hasUrl:!!product.url}},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden">
      {product.images.length > 0 && (
        <div 
          className="relative w-full aspect-square"
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            aspectRatio: "1 / 1",
          }}
        >
          <Image
            src={product.images[0].url}
            alt={product.images[0].alt}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-gray-600 mb-4 line-clamp-2">
            {product.description}
          </p>
        )}
        {product.price && (
          <div className="text-2xl font-bold text-gray-900 mb-4">
            {product.price.currency === "USD" ? "$" : ""}
            {product.price.amount.toLocaleString()}
            {product.price.currency !== "USD" && ` ${product.price.currency}`}
          </div>
        )}
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            View Product
          </a>
        )}
        {product.category && (
          <div className="mt-4 text-sm text-gray-500">
            {product.category}
          </div>
        )}
      </div>
    </div>
  );
}
