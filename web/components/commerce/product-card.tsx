'use client';
import { useState } from 'react';
import { Heart, Package, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, casePrice, money } from '@/modules/catalog/data';
import { QuantityInput } from './quantity-input';
export function ProductCard({
  product: p,
  saved,
  onSave,
  onAdd,
  onOpen,
}: {
  product: Product;
  saved: boolean;
  onSave: () => void;
  onAdd: (q: number) => boolean;
  onOpen: () => void;
}) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  return (
    <article className="product-card">
      <div className="product-image">
        <button
          className="image-link"
          onClick={onOpen}
          aria-label={`View ${p.name}`}
        >
          <img src={p.image} alt={p.name} loading="lazy" />
        </button>
        {p.tag && <span className="product-tag">{p.tag}</span>}
        <button
          className={`favorite ${saved ? 'is-saved' : ''}`}
          aria-label={`${saved ? 'Unsave' : 'Save'} ${p.name}`}
          aria-pressed={saved}
          onClick={onSave}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="product-info">
        <p className="product-brand">{p.brand}</p>
        <h2>
          <button onClick={onOpen}>{p.name}</button>
        </h2>
        <p className="product-sku">{p.sku}</p>
        <p className="product-pack">
          <Package size={13} />
          {p.pack} / case
        </p>
        <div className="price-row">
          <strong>{money(casePrice(p, quantity))}</strong>
          <span>/ case</span>
        </div>
        <p className="volume-price">
          10+ cases <strong>{money(p.volumePrice)}</strong> / case
        </p>
        <p className={`stock ${!p.available ? 'unavailable' : ''}`}>
          <span />
          {p.available
            ? 'In stock · Ready to order'
            : 'Temporarily unavailable'}
        </p>
        <div className="product-actions">
          <QuantityInput
            value={quantity}
            onChange={setQuantity}
            label={`Cases of ${p.name}`}
          />
          <Button
            disabled={!p.available}
            onClick={() => {
              if (onAdd(quantity)) {
                setAdded(true);
                setTimeout(() => setAdded(false), 1400);
              }
            }}
          >
            {added ? 'Added' : 'Add to cart'}
            {added ? <Check size={15} /> : <Plus size={15} />}
          </Button>
        </div>
      </div>
    </article>
  );
}
