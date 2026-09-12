'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function HomePage() {
  // เก็บรายการสินค้า
  const [products, setProducts] = useState([]);

  // เก็บข้อมูลฟอร์มเพิ่มสินค้า
  const [form, setForm] = useState({
    sku: '',
    name: '',
    price: '',
    stock: '',
    unit: 'ชิ้น',
  });

  // เก็บสถานะกำลังโหลด
  const [loading, setLoading] = useState(true);

  // ใช้สำหรับแก้ไขสินค้า
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // ข้อความแจ้งเตือน
  const [message, setMessage] = useState('');

  // โหลดสินค้าเมื่อเปิดหน้า
  useEffect(() => {
    fetchProducts();
  }, []);

  // ดึงข้อมูลสินค้าจาก Supabase
  async function fetchProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setMessage('ไม่สามารถโหลดข้อมูลสินค้าได้: ' + error.message);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  // อัปเดตค่าฟอร์ม
  function handleFormChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // เพิ่มสินค้า
  async function handleAddProduct(e) {
    e.preventDefault();

    if (!form.sku || !form.name || !form.price) {
      setMessage('กรุณากรอก SKU ชื่อสินค้า และราคา');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          sku: form.sku,
          name: form.name,
          price: Number(form.price),
          stock: Number(form.stock || 0),
          unit: form.unit || 'ชิ้น',
        },
      ])
      .select()
      .single();

    if (error) {
      setMessage('เพิ่มสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    // เพิ่มสินค้าใหม่เข้า state ทันที
    setProducts((prev) => [data, ...prev]);

    // ล้างฟอร์ม
    setForm({
      sku: '',
      name: '',
      price: '',
      stock: '',
      unit: 'ชิ้น',
    });

    setMessage('เพิ่มสินค้าสำเร็จ');
  }

  // เริ่มแก้ไขสินค้า
  function startEdit(product) {
    setEditingId(product.id);

    setEditForm({
      sku: product.sku,
      name: product.name,
      price: product.price,
      stock: product.stock,
      unit: product.unit,
    });

    setMessage('');
  }

  // ยกเลิกการแก้ไข
  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  // อัปเดตสินค้า
  async function handleUpdateProduct(id) {
    const { data, error } = await supabase
      .from('products')
      .update({
        sku: editForm.sku,
        name: editForm.name,
        price: Number(editForm.price),
        stock: Number(editForm.stock || 0),
        unit: editForm.unit,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setMessage('แก้ไขสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    // อัปเดตข้อมูลในตาราง
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? data : product
      )
    );

    cancelEdit();
    setMessage('แก้ไขสินค้าสำเร็จ');
  }

  // ลบสินค้า
  async function handleDeleteProduct(id) {
    const confirmed = window.confirm(
      'ต้องการลบสินค้านี้ใช่หรือไม่?'
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      setMessage('ลบสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    // ลบออกจาก state
    setProducts((prev) =>
      prev.filter((product) => product.id !== id)
    );

    setMessage('ลบสินค้าสำเร็จ');
  }

  return (
    <div>
      <h1>จัดการสินค้า</h1>

      <p className="text-muted">
        เพิ่ม แก้ไข และลบสินค้าสำหรับร้านค้า
      </p>

      {/* ฟอร์มเพิ่มสินค้า */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2>เพิ่มสินค้า</h2>

        <form onSubmit={handleAddProduct}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '12px',
            }}
          >
            <div className="form-group">
              <label>SKU</label>
              <input
                type="text"
                name="sku"
                value={form.sku}
                onChange={handleFormChange}
                placeholder="เช่น P001"
              />
            </div>

            <div className="form-group">
              <label>ชื่อสินค้า</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFormChange}
                placeholder="ชื่อสินค้า"
              />
            </div>

            <div className="form-group">
              <label>ราคา</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleFormChange}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label>คงเหลือ</label>
              <input
                type="number"
                name="stock"
                value={form.stock}
                onChange={handleFormChange}
                placeholder="0"
                min="0"
              />
            </div>

            <div className="form-group">
              <label>หน่วย</label>
              <input
                type="text"
                name="unit"
                value={form.unit}
                onChange={handleFormChange}
                placeholder="ชิ้น"
              />
            </div>
          </div>

          <button type="submit" className="btn">
            + เพิ่มสินค้า
          </button>
        </form>
      </div>

      {/* ข้อความแจ้งเตือน */}
      {message && (
        <div
          className="card"
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
          }}
        >
          {message}
        </div>
      )}

      {/* ตารางสินค้า */}
      <div>
        <h2>รายการสินค้า</h2>

        {loading ? (
          <div className="loading">
            กำลังโหลดข้อมูล...
          </div>
        ) : products.length === 0 ? (
          <div className="card empty">
            ยังไม่มีสินค้า
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>ชื่อสินค้า</th>
                  <th>ราคา</th>
                  <th>คงเหลือ</th>
                  <th>หน่วย</th>
                  <th>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => {
                  const isEditing =
                    editingId === product.id;

                  return (
                    <tr key={product.id}>
                      {/* SKU */}
                      <td>
                        {isEditing ? (
                          <input
                            value={editForm.sku}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                sku: e.target.value,
                              })
                            }
                          />
                        ) : (
                          product.sku
                        )}
                      </td>

                      {/* ชื่อสินค้า */}
                      <td>
                        {isEditing ? (
                          <input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                name: e.target.value,
                              })
                            }
                          />
                        ) : (
                          product.name
                        )}
                      </td>

                      {/* ราคา */}
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.price}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                price: e.target.value,
                              })
                            }
                          />
                        ) : (
                          `${Number(product.price).toLocaleString(
                            'th-TH'
                          )} บาท`
                        )}
                      </td>

                      {/* Stock */}
                      <td>
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            value={editForm.stock}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                stock: e.target.value,
                              })
                            }
                          />
                        ) : (
                          product.stock
                        )}
                      </td>

                      {/* Unit */}
                      <td>
                        {isEditing ? (
                          <input
                            value={editForm.unit}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                unit: e.target.value,
                              })
                            }
                          />
                        ) : (
                          product.unit
                        )}
                      </td>

                      {/* ปุ่มจัดการ */}
                      <td>
                        {isEditing ? (
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                            }}
                          >
                            <button
                              className="btn"
                              onClick={() =>
                                handleUpdateProduct(
                                  product.id
                                )
                              }
                            >
                              บันทึก
                            </button>

                            <button
                              className="btn"
                              style={{
                                background: '#6b7280',
                              }}
                              onClick={cancelEdit}
                            >
                              ยกเลิก
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                            }}
                          >
                            <button
                              className="btn"
                              onClick={() =>
                                startEdit(product)
                              }
                            >
                              แก้ไข
                            </button>

                            <button
                              className="btn"
                              style={{
                                background: '#dc2626',
                              }}
                              onClick={() =>
                                handleDeleteProduct(
                                  product.id
                                )
                              }
                            >
                              ลบ
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
