'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [gameFilter, setGameFilter] = useState('ทั้งหมด');

  const [form, setForm] = useState({
    sku: '',
    game: '',
    server: '',
    package_name: '',
    price: '',
    category: 'STANDARD',
    active: true,
  });

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setMessage('');

    const { data, error } = await supabase
      .from('products')
      .select(
        'id, sku, game, server, package_name, price, category, active, created_at'
      )
      .order('game', { ascending: true })
      .order('price', { ascending: true });

    if (error) {
      setMessage('ไม่สามารถโหลดสินค้าได้: ' + error.message);
      setProducts([]);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleAddProduct(e) {
    e.preventDefault();
    setMessage('');

    if (
      !form.sku ||
      !form.game ||
      !form.server ||
      !form.package_name ||
      form.price === ''
    ) {
      setMessage('กรุณากรอกข้อมูลสินค้าให้ครบ');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .insert([
        {
          sku: form.sku.trim(),
          game: form.game.trim(),
          server: form.server.trim(),
          package_name: form.package_name.trim(),
          price: Number(form.price),
          category: form.category || 'STANDARD',
          active: form.active,
        },
      ])
      .select()
      .single();

    if (error) {
      setMessage('เพิ่มสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setProducts((prev) => [...prev, data]);

    setForm({
      sku: '',
      game: '',
      server: '',
      package_name: '',
      price: '',
      category: 'STANDARD',
      active: true,
    });

    setMessage('เพิ่มสินค้าสำเร็จ');
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
      active: product.active ?? true,
    });

    setMessage('');
  }

  function handleEditChange(e) {
    const { name, value, type, checked } = e.target;

    setEditForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm({});
  }

  async function handleUpdateProduct(id) {
    if (
      !editForm.sku ||
      !editForm.game ||
      !editForm.server ||
      !editForm.package_name ||
      editForm.price === ''
    ) {
      setMessage('กรุณากรอกข้อมูลสินค้าให้ครบ');
      return;
    }

    const { data, error } = await supabase
      .from('products')
      .update({
        sku: editForm.sku.trim(),
        game: editForm.game.trim(),
        server: editForm.server.trim(),
        package_name: editForm.package_name.trim(),
        price: Number(editForm.price),
        category: editForm.category || 'STANDARD',
        active: editForm.active,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      setMessage('แก้ไขสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setProducts((prev) =>
      prev.map((product) =>
        product.id === id ? data : product
      )
    );

    cancelEdit();
    setMessage('แก้ไขสินค้าสำเร็จ');
  }

  async function handleDeleteProduct(id) {
    const confirmed = window.confirm(
      'ต้องการลบสินค้านี้ใช่หรือไม่?'
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      setMessage('ลบสินค้าไม่สำเร็จ: ' + error.message);
      return;
    }

    setProducts((prev) =>
      prev.filter((product) => product.id !== id)
    );

    setMessage('ลบสินค้าสำเร็จ');
  }

  const games = [
    'ทั้งหมด',
    ...Array.from(
      new Set(products.map((product) => product.game))
    ),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesGame =
      gameFilter === 'ทั้งหมด' ||
      product.game === gameFilter;

    const keyword = search.toLowerCase();

    const matchesSearch =
      !keyword ||
      product.sku?.toLowerCase().includes(keyword) ||
      product.game?.toLowerCase().includes(keyword) ||
      product.server?.toLowerCase().includes(keyword) ||
      product.package_name?.toLowerCase().includes(keyword);

    return matchesGame && matchesSearch;
  });

  return (
    <div>
      <h1>จัดการสินค้าเติมเกม</h1>

      <p className="text-muted">
        เพิ่ม แก้ไข เปิด/ปิด และลบแพ็กเกจเติมเกม
      </p>

      <div className="card" style={{ marginBottom: '24px' }}>
        <h2>เพิ่มสินค้า</h2>

        <form onSubmit={handleAddProduct}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
            }}
          >
            <div className="form-group">
              <label>SKU</label>
              <input
                name="sku"
                value={form.sku}
                onChange={handleFormChange}
                placeholder="GI-AS-60"
              />
            </div>

            <div className="form-group">
              <label>เกม</label>
              <input
                name="game"
                value={form.game}
                onChange={handleFormChange}
                placeholder="Genshin Impact"
              />
            </div>

            <div className="form-group">
              <label>Server</label>
              <input
                name="server"
                value={form.server}
                onChange={handleFormChange}
                placeholder="Asia"
              />
            </div>

            <div className="form-group">
              <label>แพ็กเกจ</label>
              <input
                name="package_name"
                value={form.package_name}
                onChange={handleFormChange}
                placeholder="60 Genesis Crystals"
              />
            </div>

            <div className="form-group">
              <label>ราคา</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleFormChange}
                min="0"
                step="0.01"
                placeholder="32"
              />
            </div>

            <div className="form-group">
              <label>ประเภท</label>
              <select
                name="category"
                value={form.category}
                onChange={handleFormChange}
              >
                <option value="STANDARD">STANDARD</option>
                <option value="POPULAR">POPULAR</option>
                <option value="MONTHLY">MONTHLY</option>
                <option value="CONTACT_ADMIN">
                  CONTACT_ADMIN
                </option>
              </select>
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px',
            }}
          >
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleFormChange}
              style={{ width: 'auto' }}
            />
            เปิดขายสินค้า
          </label>

          <button className="btn" type="submit">
            เพิ่มสินค้า
          </button>
        </form>
      </div>

      {message && (
        <div
          className="card"
          style={{ marginBottom: '20px' }}
        >
          {message}
        </div>
      )}

      <div
        className="card"
        style={{ marginBottom: '20px' }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(200px, 1fr) 220px',
            gap: '12px',
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหา SKU, เกม, Server หรือแพ็กเกจ..."
          />

          <select
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
          >
            {games.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          กำลังโหลดสินค้า...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="card empty">
          ยังไม่มีสินค้าที่ตรงกับเงื่อนไข
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>เกม</th>
                <th>Server</th>
                <th>แพ็กเกจ</th>
                <th>ราคา</th>
                <th>ประเภท</th>
                <th>สถานะ</th>
                <th>จัดการ</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((product) => (
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
                          type="number"
                          name="price"
                          value={editForm.price}
                          onChange={handleEditChange}
                          min="0"
                          step="0.01"
                        />
                      </td>

                      <td>
                        <select
                          name="category"
                          value={editForm.category}
                          onChange={handleEditChange}
                        >
                          <option value="STANDARD">
                            STANDARD
                          </option>
                          <option value="POPULAR">
                            POPULAR
                          </option>
                          <option value="MONTHLY">
                            MONTHLY
                          </option>
                          <option value="CONTACT_ADMIN">
                            CONTACT_ADMIN
                          </option>
                        </select>
                      </td>

                      <td>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <input
                            type="checkbox"
                            name="active"
                            checked={editForm.active}
                            onChange={handleEditChange}
                            style={{ width: 'auto' }}
                          />
                          เปิด
                        </label>
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
                          }}
                        >
                          <button
                            className="btn"
                            onClick={() =>
                              handleUpdateProduct(product.id)
                            }
                          >
                            บันทึก
                          </button>

                          <button
                            className="btn"
                            onClick={cancelEdit}
                            type="button"
                          >
                            ยกเลิก
                          </button>
                        </div>
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
                          : `${Number(
                              product.price
                            ).toLocaleString('th-TH')} บาท`}
                      </td>

                      <td>{product.category}</td>

                      <td>
                        {product.active ? (
                          <span className="text-success">
                            เปิดขาย
                          </span>
                        ) : (
                          <span className="text-danger">
                            ปิดขาย
                          </span>
                        )}
                      </td>

                      <td>
                        <div
                          style={{
                            display: 'flex',
                            gap: '6px',
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
                            onClick={() =>
                              handleDeleteProduct(product.id)
                            }
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
