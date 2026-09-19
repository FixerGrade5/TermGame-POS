'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  const [products, setProducts] = useState([]);

  const [selectedProductId, setSelectedProductId] =
    useState('');

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
        'id, sku, game, server, package_name, price, category, active'
      )
      .eq('active', true)
      .order('game', { ascending: true })
      .order('price', { ascending: true });

    if (error) {
      setError(
        'ไม่สามารถโหลดสินค้าได้: ' + error.message
      );
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

  const totalPrice =
    selectedProduct && quantity > 0
      ? Number(selectedProduct.price || 0) *
        Number(quantity)
      : 0;

  function handleProductChange(e) {
    setSelectedProductId(e.target.value);
    setQuantity(1);
    setMessage('');
    setError('');
  }

  function handleQuantityChange(e) {
    const value = Number(e.target.value);

    setQuantity(
      Number.isInteger(value) && value >= 1 ? value : 1
    );

    setMessage('');
    setError('');
  }

  async function handleSell(e) {
    e.preventDefault();

    setMessage('');
    setError('');

    if (!selectedProduct) {
      setError('กรุณาเลือกสินค้า');
      return;
    }

    if (selectedProduct.price === null) {
      setError(
        'สินค้านี้เป็นแบบสอบถามราคา ไม่สามารถขายผ่านระบบได้'
      );
      return;
    }

    const sellQuantity = Number(quantity);

    if (
      !Number.isInteger(sellQuantity) ||
      sellQuantity < 1
    ) {
      setError('กรุณากรอกจำนวนที่ถูกต้อง');
      return;
    }

    setSelling(true);

    const total =
      Number(selectedProduct.price) * sellQuantity;

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
        'บันทึกรายการขายไม่สำเร็จ: ' +
          saleError.message
      );

      setSelling(false);
      return;
    }

    setMessage(
      `เติม ${selectedProduct.game} - ${selectedProduct.package_name} จำนวน ${sellQuantity} รายการ สำเร็จ ยอดรวม ${total.toLocaleString(
        'th-TH'
      )} บาท`
    );

    setQuantity(1);
    setSelling(false);
  }

  if (loading) {
    return (
      <div>
        <h1>เติมเกม / ขายสินค้า</h1>

        <div className="loading">
          กำลังโหลดสินค้า...
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>เติมเกม / ขายสินค้า</h1>

      <p className="text-muted">
        เลือกเกม Server และแพ็กเกจที่ต้องการขาย
      </p>

      {error && (
        <div
          className="card text-danger"
          style={{
            marginBottom: '16px',
            background: '#fef2f2',
          }}
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className="card text-success"
          style={{
            marginBottom: '16px',
            background: '#f0fdf4',
          }}
        >
          {message}
        </div>
      )}

      {products.length === 0 ? (
        <div className="card empty">
          ยังไม่มีสินค้าที่เปิดขาย
          <br />
          กรุณาเพิ่มสินค้าในหน้าจัดการสินค้า
        </div>
      ) : (
        <div
          className="card"
          style={{
            maxWidth: '650px',
            margin: '0 auto',
          }}
        >
          <form onSubmit={handleSell}>
            <div className="form-group">
              <label>เลือกแพ็กเกจ</label>

              <select
                value={selectedProductId}
                onChange={handleProductChange}
              >
                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.game} | {product.server} |{' '}
                    {product.package_name} |{' '}
                    {product.price === null
                      ? 'สอบถามราคา'
                      : `${Number(
                          product.price
                        ).toLocaleString('th-TH')} บาท`}
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div
                className="card"
                style={{
                  marginBottom: '20px',
                  background: '#f8f9fa',
                }}
              >
                <div>
                  <strong>เกม:</strong>{' '}
                  {selectedProduct.game}
                </div>

                <div>
                  <strong>Server:</strong>{' '}
                  {selectedProduct.server}
                </div>

                <div>
                  <strong>แพ็กเกจ:</strong>{' '}
                  {selectedProduct.package_name}
                </div>

                <div style={{ marginTop: '8px' }}>
                  <strong>ราคา:</strong>{' '}
                  {selectedProduct.price === null
                    ? 'สอบถามราคา'
                    : `${Number(
                        selectedProduct.price
                      ).toLocaleString('th-TH')} บาท`}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>จำนวน</label>

              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={handleQuantityChange}
              />
            </div>

            <div
              style={{
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '20px',
              }}
            >
              <div className="text-muted">
                ยอดรวม
              </div>

              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '700',
                }}
              >
                {totalPrice.toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                บาท
              </div>
            </div>

            <button
              className="btn"
              type="submit"
              disabled={
                selling ||
                !selectedProduct ||
                selectedProduct.price === null
              }
              style={{
                width: '100%',
              }}
            >
              {selling
                ? 'กำลังบันทึก...'
                : 'ยืนยันการขาย'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
