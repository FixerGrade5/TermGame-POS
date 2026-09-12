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

  // โหลดสินค้า
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setError(
        'ไม่สามารถโหลดสินค้าได้: ' + error.message
      );
    } else {
      setProducts(data || []);

      if (data && data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    }

    setLoading(false);
  }

  // หาสินค้าที่เลือก
  const selectedProduct = products.find(
    (product) => product.id === selectedProductId
  );

  // คำนวณยอดรวม
  const totalPrice =
    selectedProduct && quantity > 0
      ? Number(selectedProduct.price) * Number(quantity)
      : 0;

  // เปลี่ยนสินค้า
  function handleProductChange(e) {
    setSelectedProductId(e.target.value);
    setMessage('');
    setError('');
    setQuantity(1);
  }

  // เปลี่ยนจำนวน
  function handleQuantityChange(e) {
    const value = Number(e.target.value);

    if (value < 1) {
      setQuantity(1);
    } else {
      setQuantity(value);
    }

    setMessage('');
    setError('');
  }

  // ขายสินค้า
  async function handleSell(e) {
    e.preventDefault();

    setMessage('');
    setError('');

    if (!selectedProduct) {
      setError('กรุณาเลือกสินค้า');
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

    if (sellQuantity > Number(selectedProduct.stock)) {
      setError(
        `สินค้าเหลือ ${selectedProduct.stock} ${selectedProduct.unit} ไม่เพียงพอ`
      );
      return;
    }

    setSelling(true);

    const total =
      Number(selectedProduct.price) * sellQuantity;

    const oldStock = Number(selectedProduct.stock);

    const newStock = oldStock - sellQuantity;

    // ลด Stock
    const {
      data: updatedProducts,
      error: stockError,
    } = await supabase
      .from('products')
      .update({
        stock: newStock,
      })
      .eq('id', selectedProduct.id)
      .gte('stock', sellQuantity)
      .select();

    if (stockError) {
      setError(
        'ไม่สามารถอัปเดต Stock ได้: ' +
          stockError.message
      );

      setSelling(false);
      return;
    }

    // ตรวจสอบว่า Stock ถูกลดจริง
    if (
      !updatedProducts ||
      updatedProducts.length === 0
    ) {
      setError(
        'Stock ไม่เพียงพอ หรือสินค้าอาจถูกเปลี่ยนแปลงแล้ว'
      );

      setSelling(false);

      await fetchProducts();

      return;
    }

    // บันทึกประวัติการขาย
    const { error: saleError } = await supabase
      .from('sales')
      .insert([
        {
          product_id: selectedProduct.id,

          // บันทึก SKU ของสินค้า
          product_sku: selectedProduct.sku,

          // บันทึกชื่อสินค้า
          product_name: selectedProduct.name,

          quantity: sellQuantity,

          total_price: total,

          sold_at: new Date().toISOString(),
        },
      ]);

    // ถ้าบันทึกการขายไม่สำเร็จ
    // พยายามคืน Stock กลับ
    if (saleError) {
      await supabase
        .from('products')
        .update({
          stock: oldStock,
        })
        .eq('id', selectedProduct.id);

      setError(
        'บันทึกรายการขายไม่สำเร็จ: ' +
          saleError.message
      );

      setSelling(false);

      await fetchProducts();

      return;
    }

    // อัปเดต Stock บนหน้าเว็บ
    setProducts((prev) =>
      prev.map((product) =>
        product.id === selectedProduct.id
          ? {
              ...product,
              stock: newStock,
            }
          : product
      )
    );

    // แสดงข้อความสำเร็จ
    setMessage(
      `ขาย ${selectedProduct.name} จำนวน ${sellQuantity} ${selectedProduct.unit} สำเร็จ ยอดรวม ${total.toLocaleString(
        'th-TH'
      )} บาท`
    );

    // Reset จำนวน
    setQuantity(1);

    setSelling(false);
  }

  return (
    <div>
      <h1>ขายสินค้า</h1>

      <p className="text-muted">
        เลือกสินค้าและจำนวนที่ต้องการขาย
      </p>

      <div
        className="card"
        style={{
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <form onSubmit={handleSell}>
          {/* เลือกสินค้า */}
          <div className="form-group">
            <label>สินค้า</label>

            {loading ? (
              <div className="loading">
                กำลังโหลดสินค้า...
              </div>
            ) : products.length === 0 ? (
              <div className="empty">
                ยังไม่มีสินค้า กรุณาเพิ่มสินค้าก่อน
              </div>
            ) : (
              <select
                value={selectedProductId}
                onChange={handleProductChange}
                disabled={selling}
              >
                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.sku} - {product.name} -{' '}
                    {Number(
                      product.price
                    ).toLocaleString('th-TH')}{' '}
                    บาท / {product.unit} (เหลือ{' '}
                    {product.stock})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* รายละเอียดสินค้า */}
          {selectedProduct && (
            <div
              style={{
                padding: '16px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <div>
                <strong>
                  {selectedProduct.name}
                </strong>
              </div>

              <div
                className="text-muted"
                style={{
                  marginTop: '4px',
                }}
              >
                SKU: {selectedProduct.sku}
              </div>

              <div
                style={{
                  marginTop: '8px',
                }}
              >
                ราคา:{' '}
                <strong>
                  {Number(
                    selectedProduct.price
                  ).toLocaleString('th-TH')}{' '}
                  บาท / {selectedProduct.unit}
                </strong>
              </div>

              <div className="stock">
                คงเหลือ: {selectedProduct.stock}{' '}
                {selectedProduct.unit}
              </div>
            </div>
          )}

          {/* จำนวน */}
          <div className="form-group">
            <label>จำนวนที่ขาย</label>

            <input
              type="number"
              min="1"
              max={selectedProduct?.stock || 1}
              value={quantity}
              onChange={handleQuantityChange}
              disabled={
                !selectedProduct || selling
              }
            />
          </div>

          {/* ยอดรวม */}
          {selectedProduct && (
            <div
              style={{
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              <div className="text-muted">
                ยอดรวม
              </div>

              <div
                style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  marginTop: '4px',
                }}
              >
                {totalPrice.toLocaleString(
                  'th-TH'
                )}{' '}
                บาท
              </div>

              <div className="text-muted">
                {Number(
                  selectedProduct.price
                ).toLocaleString('th-TH')}{' '}
                × {quantity}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="text-danger"
              style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#fef2f2',
                borderRadius: '8px',
              }}
            >
              {error}
            </div>
          )}

          {/* สำเร็จ */}
          {message && (
            <div
              className="text-success"
              style={{
                marginBottom: '16px',
                padding: '12px',
                background: '#f0fdf4',
                borderRadius: '8px',
              }}
            >
              {message}
            </div>
          )}

          {/* ปุ่มขาย */}
          <button
            type="submit"
            className="btn"
            disabled={
              selling ||
              !selectedProduct ||
              products.length === 0
            }
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
            }}
          >
            {selling
              ? 'กำลังบันทึก...'
              : 'ขาย'}
          </button>
        </form>
      </div>
    </div>
  );
}
