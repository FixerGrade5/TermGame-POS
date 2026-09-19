'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [loading, setLoading] = useState(true);
  const [selling, setSelling] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('products')
      .select(
        'id, sku, game, server, package_name, price, category, stock, active'
      )
      .eq('active', true)
      .order('game', { ascending: true })
      .order('price', { ascending: true });

    if (error) {
      setError('ไม่สามารถโหลดสินค้าได้: ' + error.message);
      setProducts([]);
    } else {
      setProducts(data || []);

      if (data && data.length > 0) {
        setSelectedProductId(String(data[0].id));
      }
    }

    setLoading(false);
  }

  const selectedProduct = products.find(
    (product) =>
      String(product.id) === String(selectedProductId)
  );

  const stock = Number(selectedProduct?.stock || 0);

  const totalPrice =
    selectedProduct && selectedProduct.price !== null
      ? Number(selectedProduct.price) * Number(quantity)
      : 0;

  async function handleSell(e) {
    e.preventDefault();

    setMessage('');
    setError('');

    if (!selectedProduct) {
      setError('กรุณาเลือกสินค้า');
      return;
    }

    if (selectedProduct.price === null) {
      setError('สินค้านี้ไม่มีราคา กรุณาสอบถามราคาก่อน');
      return;
    }

    const sellQuantity = Number(quantity);

    if (!Number.isInteger(sellQuantity) || sellQuantity <= 0) {
      setError('จำนวนต้องเป็นเลขจำนวนเต็มมากกว่า 0');
      return;
    }

    // ตรวจสอบ Stock
    if (sellQuantity > stock) {
      setError(
        `สินค้าไม่เพียงพอ คงเหลือ ${stock} ชิ้น`
      );
      return;
    }

    setSelling(true);

    const total = Number(selectedProduct.price) * sellQuantity;

    // ==========================================
    // 1. บันทึกประวัติการขาย
    // ==========================================

    const { error: saleError } = await supabase
      .from('sales')
      .insert([
        {
          product_id: selectedProduct.id,
          product_sku: selectedProduct.sku,
          product_name: `${selectedProduct.game} - ${selectedProduct.package_name}`,
          quantity: sellQuantity,
          total_price: total,
          sold_at: new Date().toISOString(),
        },
      ]);

    if (saleError) {
      setError(
        'บันทึกการขายไม่สำเร็จ: ' +
          saleError.message
      );

      setSelling(false);
      return;
    }

    // ==========================================
    // 2. หัก Stock
    // ==========================================

    const newStock = stock - sellQuantity;

    const { error: stockError } = await supabase
      .from('products')
      .update({
        stock: newStock,
      })
      .eq('id', selectedProduct.id);

    if (stockError) {
      setError(
        'บันทึกการขายแล้ว แต่หัก Stock ไม่สำเร็จ: ' +
          stockError.message
      );

      setSelling(false);
      return;
    }

    // ==========================================
    // 3. แสดงผลสำเร็จ
    // ==========================================

    setMessage(
      `ขายสำเร็จ ${sellQuantity} ชิ้น รวม ฿${total.toLocaleString()} | คงเหลือ ${newStock} ชิ้น`
    );

    setQuantity(1);

    // โหลด Stock ใหม่
    await fetchProducts();

    setSelling(false);
  }

  return (
    <main
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '30px 20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>ขายสินค้า</h1>

      {loading ? (
        <p>กำลังโหลดสินค้า...</p>
      ) : products.length === 0 ? (
        <p>ยังไม่มีสินค้าที่เปิดขาย</p>
      ) : (
        <form
          onSubmit={handleSell}
          style={{
            border: '1px solid #ddd',
            borderRadius: '12px',
            padding: '25px',
          }}
        >
          {/* =========================
              PRODUCT
          ========================= */}

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
              }}
            >
              สินค้า
            </label>

            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setQuantity(1);
                setMessage('');
                setError('');
              }}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '16px',
              }}
            >
              {products.map((product) => (
                <option
                  key={product.id}
                  value={product.id}
                >
                  {product.game} | {product.server} |{' '}
                  {product.package_name} | ฿
                  {product.price === null
                    ? 'สอบถามราคา'
                    : Number(
                        product.price
                      ).toLocaleString()}
                  {' '}| เหลือ {product.stock || 0}
                </option>
              ))}
            </select>
          </div>

          {/* =========================
              PRODUCT INFO
          ========================= */}

          {selectedProduct && (
            <div
              style={{
                background: '#f5f5f5',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '20px',
              }}
            >
              <p>
                <strong>SKU:</strong>{' '}
                {selectedProduct.sku}
              </p>

              <p>
                <strong>เกม:</strong>{' '}
                {selectedProduct.game}
              </p>

              <p>
                <strong>Server:</strong>{' '}
                {selectedProduct.server}
              </p>

              <p>
                <strong>แพ็กเกจ:</strong>{' '}
                {selectedProduct.package_name}
              </p>

              <p>
                <strong>ราคาต่อชิ้น:</strong>{' '}
                ฿
                {Number(
                  selectedProduct.price || 0
                ).toLocaleString()}
              </p>

              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color:
                    stock > 0 ? 'green' : 'red',
                }}
              >
                คงเหลือ: {stock} ชิ้น
              </p>
            </div>
          )}

          {/* =========================
              QUANTITY
          ========================= */}

          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 'bold',
              }}
            >
              จำนวน
            </label>

            <input
              type="number"
              min="1"
              max={stock}
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '18px',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* =========================
              TOTAL
          ========================= */}

          <div
            style={{
              borderTop: '1px solid #ddd',
              paddingTop: '20px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                marginBottom: '5px',
              }}
            >
              จำนวน: {Number(quantity) || 0} ชิ้น
            </div>

            <div
              style={{
                fontSize: '26px',
                fontWeight: 'bold',
              }}
            >
              รวม: ฿{totalPrice.toLocaleString()}
            </div>
          </div>

          {/* =========================
              MESSAGE
          ========================= */}

          {message && (
            <div
              style={{
                background: '#e8f5e9',
                color: '#2e7d32',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
              }}
            >
              {message}
            </div>
          )}

          {error && (
            <div
              style={{
                background: '#ffebee',
                color: '#c62828',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '15px',
              }}
            >
              {error}
            </div>
          )}

          {/* =========================
              SELL BUTTON
          ========================= */}

          <button
            type="submit"
            disabled={
              selling ||
              !selectedProduct ||
              stock <= 0
            }
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor:
                selling || stock <= 0
                  ? 'not-allowed'
                  : 'pointer',
              opacity:
                selling || stock <= 0
                  ? 0.6
                  : 1,
            }}
          >
            {selling
              ? 'กำลังบันทึก...'
              : stock <= 0
              ? 'สินค้าหมด'
              : 'ขายสินค้า'}
          </button>
        </form>
      )}
    </main>
  );
}
