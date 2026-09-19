'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    sku: '',
    game: '',
    server: '',
    package_name: '',
    price: '',
    category: 'STANDARD',
    stock: 0,
    active: true,
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [editForm, setEditForm] = useState({
    sku: '',
    game: '',
    server: '',
    package_name: '',
    price: '',
    category: 'STANDARD',
    stock: 0,
    active: true,
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('products')
      .select(
        'id, sku, game, server, package_name, price, category, stock, active, created_at'
      )
      .order('game', { ascending: true })
      .order('price', { ascending: true });

    if (error) {
      setError('โหลดสินค้าไม่สำเร็จ: ' + error.message);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  }

  async function handleAdd(e) {
    e.preventDefault();

    setMessage('');
    setError('');

    if (!form.sku || !form.game || !form.server || !form.package_name) {
      setError('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const { error } = await supabase.from('products').insert([
      {
        sku: form.sku,
        game: form.game,
        server: form.server,
        package_name: form.package_name,
        price: form.price === '' ? null : Number(form.price),
        category: form.category,
        stock: Number(form.stock) || 0,
        active: form.active,
      },
    ]);

    if (error) {
      setError('เพิ่มสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setMessage('เพิ่มสินค้าเรียบร้อย');

    setForm({
      sku: '',
      game: '',
      server: '',
      package_name: '',
      price: '',
      category: 'STANDARD',
      stock: 0,
      active: true,
    });

    fetchProducts();
  }

  function startEdit(product) {
    setEditingId(product.id);

    setEditForm({
      sku: product.sku || '',
      game: product.game || '',
      server: product.server || '',
      package_name: product.package_name || '',
      price: product.price ?? '',
      category: product.category || 'STANDARD',
      stock: product.stock ?? 0,
      active: product.active ?? true,
    });

    setMessage('');
    setError('');
  }

  function handleEditChange(e) {
    const { name, value, type, checked } = e.target;

    setEditForm({
      ...editForm,
      [name]: type === 'checkbox' ? checked : value,
    });
  }

  async function saveEdit(id) {
    setMessage('');
    setError('');

    const { error } = await supabase
      .from('products')
      .update({
        sku: editForm.sku,
        game: editForm.game,
        server: editForm.server,
        package_name: editForm.package_name,
        price: editForm.price === '' ? null : Number(editForm.price),
        category: editForm.category,
        stock: Number(editForm.stock) || 0,
        active: editForm.active,
      })
      .eq('id', id);

    if (error) {
      setError('แก้ไขสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setMessage('แก้ไขสินค้าเรียบร้อย');
    setEditingId(null);

    fetchProducts();
  }

  async function deleteProduct(id) {
    const confirmDelete = window.confirm(
      'ต้องการลบสินค้านี้ใช่หรือไม่?'
    );

    if (!confirmDelete) return;

    setMessage('');
    setError('');

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      setError('ลบสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setMessage('ลบสินค้าเรียบร้อย');

    fetchProducts();
  }

  // =========================
  // สรุปข้อมูล
  // =========================

  const totalProducts = products.length;

  const totalStock = products.reduce(
    (sum, product) => sum + Number(product.stock || 0),
    0
  );

  const activeProducts = products.filter(
    (product) => product.active
  ).length;

  const totalGames = new Set(
    products.map((product) => product.game)
  ).size;

  return (
    <main
      style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '30px 20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1>Game Top-up POS</h1>

      {/* =========================
          SUMMARY
      ========================= */}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px',
        }}
      >
        <SummaryCard
          title="สินค้าทั้งหมด"
          value={totalProducts}
          unit="รายการ"
        />

        <SummaryCard
          title="สินค้าคงเหลือ"
          value={totalStock}
          unit="ชิ้น"
        />

        <SummaryCard
          title="เปิดขายอยู่"
          value={activeProducts}
          unit="รายการ"
        />

        <SummaryCard
          title="จำนวนเกม"
          value={totalGames}
          unit="เกม"
        />
      </div>

      {/* =========================
          ADD PRODUCT
      ========================= */}

      <section
        style={{
          border: '1px solid #ddd',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '30px',
        }}
      >
        <h2>เพิ่มสินค้า</h2>

        <form onSubmit={handleAdd}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            <input
              name="sku"
              placeholder="SKU"
              value={form.sku}
              onChange={handleChange}
            />

            <input
              name="game"
              placeholder="ชื่อเกม"
              value={form.game}
              onChange={handleChange}
            />

            <input
              name="server"
              placeholder="Server"
              value={form.server}
              onChange={handleChange}
            />

            <input
              name="package_name"
              placeholder="ชื่อแพ็กเกจ"
              value={form.package_name}
              onChange={handleChange}
            />

            <input
              name="price"
              type="number"
              placeholder="ราคา"
              value={form.price}
              onChange={handleChange}
            />

            <input
              name="stock"
              type="number"
              min="0"
              placeholder="จำนวนคงเหลือ"
              value={form.stock}
              onChange={handleChange}
            />

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="STANDARD">STANDARD</option>
              <option value="POPULAR">POPULAR</option>
              <option value="MONTHLY">MONTHLY</option>
              <option value="CONTACT_ADMIN">
                CONTACT_ADMIN
              </option>
            </select>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
              />
              เปิดขาย
            </label>
          </div>

          <button
            type="submit"
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              cursor: 'pointer',
            }}
          >
            เพิ่มสินค้า
          </button>
        </form>
      </section>

      {message && (
        <p style={{ color: 'green' }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {/* =========================
          PRODUCT TABLE
      ========================= */}

      <section>
        <h2>รายการสินค้า</h2>

        {loading ? (
          <p>กำลังโหลด...</p>
        ) : products.length === 0 ? (
          <p>ยังไม่มีสินค้า</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              border="1"
              cellPadding="10"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
              }}
            >
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>เกม</th>
                  <th>Server</th>
                  <th>แพ็กเกจ</th>
                  <th>ราคา</th>
                  <th>คงเหลือ</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    {editingId === product.id ? (
                      <>
                        <td>
                          <input
                            name="sku"
                            value={editForm.sku}
                            onChange={handleEditChange}
                          />
                        </td>

                        <td>
                          <input
                            name="game"
                            value={editForm.game}
                            onChange={handleEditChange}
                          />
                        </td>

                        <td>
                          <input
                            name="server"
                            value={editForm.server}
                            onChange={handleEditChange}
                          />
                        </td>

                        <td>
                          <input
                            name="package_name"
                            value={editForm.package_name}
                            onChange={handleEditChange}
                          />
                        </td>

                        <td>
                          <input
                            name="price"
                            type="number"
                            value={editForm.price}
                            onChange={handleEditChange}
                          />
                        </td>

                        <td>
                          <input
                            name="stock"
                            type="number"
                            min="0"
                            value={editForm.stock}
                            onChange={handleEditChange}
                          />
                        </td>

                        <td>
                          <label>
                            <input
                              type="checkbox"
                              name="active"
                              checked={editForm.active}
                              onChange={handleEditChange}
                            />
                            เปิดขาย
                          </label>
                        </td>

                        <td>
                          <button
                            onClick={() =>
                              saveEdit(product.id)
                            }
                          >
                            บันทึก
                          </button>

                          <button
                            onClick={() =>
                              setEditingId(null)
                            }
                            style={{ marginLeft: '5px' }}
                          >
                            ยกเลิก
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{product.sku}</td>

                        <td>{product.game}</td>

                        <td>{product.server}</td>

                        <td>{product.package_name}</td>

                        <td>
                          {product.price === null
                            ? 'สอบถามราคา'
                            : `฿${Number(
                                product.price
                              ).toLocaleString()}`}
                        </td>

                        <td>
                          <strong
                            style={{
                              color:
                                Number(product.stock) <= 0
                                  ? 'red'
                                  : 'green',
                            }}
                          >
                            {product.stock || 0}
                          </strong>
                        </td>

                        <td>
                          {product.active
                            ? 'เปิดขาย'
                            : 'ปิดขาย'}
                        </td>

                        <td>
                          <button
                            onClick={() =>
                              startEdit(product)
                            }
                          >
                            แก้ไข
                          </button>

                          <button
                            onClick={() =>
                              deleteProduct(product.id)
                            }
                            style={{
                              marginLeft: '5px',
                            }}
                          >
                            ลบ
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SummaryCard({ title, value, unit }) {
  return (
    <div
      style={{
        border: '1px solid #ddd',
        borderRadius: '12px',
        padding: '20px',
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: '8px',
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: '30px',
          fontWeight: 'bold',
        }}
      >
        {Number(value).toLocaleString()}
      </div>

      <div
        style={{
          fontSize: '13px',
          color: '#777',
        }}
      >
        {unit}
      </div>
    </div>
  );
}
