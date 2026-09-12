'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function HistoryPage() {
  // เก็บรายการประวัติการขาย
  const [sales, setSales] = useState([]);

  // สถานะโหลดข้อมูล
  const [loading, setLoading] = useState(true);

  // ข้อความ Error
  const [error, setError] = useState('');

  // โหลดประวัติการขายเมื่อเปิดหน้า
  useEffect(() => {
    fetchSales();
  }, []);

  // ดึงข้อมูลจากตาราง sales เรียงล่าสุดไปเก่าสุด
  async function fetchSales() {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .order('sold_at', { ascending: false });

    if (error) {
      setError(
        'ไม่สามารถโหลดประวัติการขายได้: ' +
          error.message
      );
      setSales([]);
    } else {
      setSales(data || []);
    }

    setLoading(false);
  }

  // คำนวณยอดขายรวมทั้งหมด
  const totalSales = sales.reduce(
    (sum, sale) => sum + Number(sale.total_price || 0),
    0
  );

  // แปลงวันที่ให้อ่านง่าย
  function formatDate(date) {
    if (!date) return '-';

    return new Date(date).toLocaleString('th-TH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }

  return (
    <div>
      <h1>ประวัติการขาย</h1>

      <p className="text-muted">
        รายการขายสินค้าทั้งหมดของร้าน
      </p>

      {/* สรุปยอดขายรวม */}
      <div
        className="card"
        style={{
          marginBottom: '24px',
          maxWidth: '400px',
        }}
      >
        <div className="text-muted">
          ยอดขายรวมทั้งหมด
        </div>

        <div
          style={{
            fontSize: '32px',
            fontWeight: '700',
            marginTop: '6px',
          }}
        >
          {totalSales.toLocaleString('th-TH', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{' '}
          บาท
        </div>

        <div className="text-muted">
          จำนวนรายการขาย {sales.length} รายการ
        </div>
      </div>

      {/* แสดง Error */}
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

      <h2>รายการขาย</h2>

      {/* ตารางประวัติการขาย */}
      {loading ? (
        <div className="loading">
          กำลังโหลดประวัติการขาย...
        </div>
      ) : sales.length === 0 ? (
        <div className="card empty">
          ยังไม่มีประวัติการขาย
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>วันเวลาที่ขาย</th>
                <th>ชื่อสินค้า</th>
                <th>จำนวน</th>
                <th>ยอดรวม</th>
              </tr>
            </thead>

            <tbody>
              {sales.map((sale) => (
                <tr key={sale.id}>
                  {/* วันเวลาขาย */}
                  <td>
                    {formatDate(sale.sold_at)}
                  </td>

                  {/* ชื่อสินค้า */}
                  <td>
                    {sale.product_name}
                  </td>

                  {/* จำนวน */}
                  <td>
                    {sale.quantity}
                  </td>

                  {/* ยอดรวม */}
                  <td>
                    {Number(
                      sale.total_price || 0
                    ).toLocaleString('th-TH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    บาท
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
