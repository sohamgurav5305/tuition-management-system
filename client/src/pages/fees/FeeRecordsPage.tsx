import React, { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/common/Button';
import { PlusCircle, CreditCard } from 'lucide-react';
import { studentApi, batchApi } from '../../services/api';
import { Student, Batch, Payment } from '../../types';
import { FeeRecordsSection } from './FeeRecordsSection';
import { CollectPaymentModal } from './CollectPaymentModal';
import { AssignFeeModal } from './AssignFeeModal';
import { ReceiptModal } from '../../components/common/ReceiptModal';

export const FeeRecordsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCollectOpen, setIsCollectOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedStudentForPay, setSelectedStudentForPay] = useState<Student | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);

  const loadData = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const [stuRes, batRes] = await Promise.all([
        studentApi.getAll({}).catch((err) => {
          console.error('Failed students fetch', err);
          return { data: { data: [] } };
        }),
        batchApi.getAll({ status: 'ACTIVE' }).catch((err) => {
          console.error('Failed batches fetch', err);
          return { data: { data: [] } };
        }),
      ]);
      if (stuRes.data?.data) setStudents(stuRes.data.data);
      if (batRes.data?.data) setBatches(batRes.data.data);
    } catch (err) {
      console.error('Failed to load fee records data', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
    const interval = setInterval(() => {
      loadData(false);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenCollect = (student?: Student) => {
    setSelectedStudentForPay(student || null);
    setIsCollectOpen(true);
  };

  const handlePaymentRecorded = (newPayment: any) => {
    loadData();
    if (newPayment) {
      setSelectedReceipt(newPayment);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <PageHeader
        title="Fee Records & Register"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={PlusCircle}
              onClick={() => setIsAssignOpen(true)}
            >
              Assign Fee
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={CreditCard}
              onClick={() => handleOpenCollect()}
            >
              Collect Fee Payment
            </Button>
          </div>
        }
      />

      {/* Main Fee Records Section */}
      <FeeRecordsSection
        students={students}
        batches={batches}
        loading={loading}
        onOpenCollect={handleOpenCollect}
      />

      {/* Payment Collection Modal */}
      <CollectPaymentModal
        isOpen={isCollectOpen}
        onClose={() => {
          setIsCollectOpen(false);
          setSelectedStudentForPay(null);
        }}
        onSuccess={handlePaymentRecorded}
        student={selectedStudentForPay}
      />

      {/* Assign Fee Modal */}
      <AssignFeeModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={loadData}
      />

      {/* Official A4 Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          payment={selectedReceipt}
        />
      )}
    </div>
  );
};

export default FeeRecordsPage;
