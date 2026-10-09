export { BankConstraints } from "@/lib/constraints/bank";
export { AguinaldoRunConstraints } from "@/lib/constraints/aguinaldo-run";
export { ContactMessageConstraints } from "@/lib/constraints/contact-message";
export { CustomerConstraints } from "@/lib/constraints/customer";
export { DepartmentConstraints } from "@/lib/constraints/department";
export { DteConfigConstraints, SettingConstraints } from "@/lib/constraints/setting";
export { DocumentTypeConstraints } from "@/lib/constraints/document-type";
export { EmployeeBankAccountConstraints } from "@/lib/constraints/employee-bank-account";
export { EmployeeConstraints } from "@/lib/constraints/employee";
export { EmployeeDocumentConstraints } from "@/lib/constraints/employee-document";
export { EmployeeTerminationConstraints } from "@/lib/constraints/employee-termination";
export { FamilyConstraints } from "@/lib/constraints/family";
export { HolidayConstraints } from "@/lib/constraints/holiday";
export { InventoryCountConstraints, InventoryCountLineConstraints } from "@/lib/constraints/inventory-count";
export { InventoryMovementConstraints } from "@/lib/constraints/inventory-movement";
export { IvaReportConstraints } from "@/lib/constraints/iva-report";
export { LeaveRequestConstraints } from "@/lib/constraints/leave-request";
export { LeaveTypeConstraints } from "@/lib/constraints/leave-type";
export { MeasurementTypeConstraints } from "@/lib/constraints/measurement-type";
export { PayrollDetailConstraints, PayrollRunConstraints } from "@/lib/constraints/payroll-run";
export { PayrollPeriodConstraints } from "@/lib/constraints/payroll-period";
export { PositionConstraints } from "@/lib/constraints/position";
export { ProductConstraints } from "@/lib/constraints/product";
export { PurchaseOrderConstraints, PurchaseOrderDetailConstraints } from "@/lib/constraints/purchase-order";
export { SaleUnitConstraints } from "@/lib/constraints/sale-unit";
export { ShopOrderConstraints, ShopPaymentConstraints } from "@/lib/constraints/shop-order";
export { SubfamilyConstraints } from "@/lib/constraints/subfamily";
export { SupplierConstraints } from "@/lib/constraints/supplier";
export { VacationBalanceConstraints } from "@/lib/constraints/vacation-balance";
export { AdminPasswordConstraints, WebUserConstraints } from "@/lib/constraints/web-user";
export {
  deriveModelConstraints,
  type ConstraintModel,
  type ConstraintSemantics,
  type ModelConstraints,
} from "@/lib/constraints/source";
export type { FieldConstraint } from "@/lib/constraints/types";

import { AguinaldoRunConstraints } from "@/lib/constraints/aguinaldo-run";
import { BankConstraints } from "@/lib/constraints/bank";
import { ContactMessageConstraints } from "@/lib/constraints/contact-message";
import { CustomerConstraints } from "@/lib/constraints/customer";
import { DepartmentConstraints } from "@/lib/constraints/department";
import { DocumentTypeConstraints } from "@/lib/constraints/document-type";
import { DteConfigConstraints, SettingConstraints } from "@/lib/constraints/setting";
import { EmployeeBankAccountConstraints } from "@/lib/constraints/employee-bank-account";
import { EmployeeConstraints } from "@/lib/constraints/employee";
import { EmployeeDocumentConstraints } from "@/lib/constraints/employee-document";
import { EmployeeTerminationConstraints } from "@/lib/constraints/employee-termination";
import { FamilyConstraints } from "@/lib/constraints/family";
import { HolidayConstraints } from "@/lib/constraints/holiday";
import { InventoryCountConstraints, InventoryCountLineConstraints } from "@/lib/constraints/inventory-count";
import { InventoryMovementConstraints } from "@/lib/constraints/inventory-movement";
import { IvaReportConstraints } from "@/lib/constraints/iva-report";
import { LeaveRequestConstraints } from "@/lib/constraints/leave-request";
import { LeaveTypeConstraints } from "@/lib/constraints/leave-type";
import { MeasurementTypeConstraints } from "@/lib/constraints/measurement-type";
import { PayrollDetailConstraints, PayrollRunConstraints } from "@/lib/constraints/payroll-run";
import { PayrollPeriodConstraints } from "@/lib/constraints/payroll-period";
import { PositionConstraints } from "@/lib/constraints/position";
import { ProductConstraints } from "@/lib/constraints/product";
import { PurchaseOrderConstraints, PurchaseOrderDetailConstraints } from "@/lib/constraints/purchase-order";
import { SaleUnitConstraints } from "@/lib/constraints/sale-unit";
import { ShopOrderConstraints, ShopPaymentConstraints } from "@/lib/constraints/shop-order";
import { SubfamilyConstraints } from "@/lib/constraints/subfamily";
import { SupplierConstraints } from "@/lib/constraints/supplier";
import { VacationBalanceConstraints } from "@/lib/constraints/vacation-balance";
import { WebUserConstraints } from "@/lib/constraints/web-user";

/** Mapas por modelo usados por la prueba común de paridad del contrato. */
export const CONSTRAINT_MAPS = {
  AguinaldoRun: AguinaldoRunConstraints,
  Bank: BankConstraints,
  ContactMessage: ContactMessageConstraints,
  Customer: CustomerConstraints,
  Department: DepartmentConstraints,
  DteConfig: DteConfigConstraints,
  Employee: EmployeeConstraints,
  EmployeeBankAccount: EmployeeBankAccountConstraints,
  EmployeeDocument: EmployeeDocumentConstraints,
  EmployeeTermination: EmployeeTerminationConstraints,
  Family: FamilyConstraints,
  Holiday: HolidayConstraints,
  InventoryCount: InventoryCountConstraints,
  InventoryCountLine: InventoryCountLineConstraints,
  InventoryMovement: InventoryMovementConstraints,
  IvaReport: IvaReportConstraints,
  LeaveRequest: LeaveRequestConstraints,
  LeaveType: LeaveTypeConstraints,
  MeasurementType: MeasurementTypeConstraints,
  PayrollDetail: PayrollDetailConstraints,
  PayrollPeriod: PayrollPeriodConstraints,
  PayrollRun: PayrollRunConstraints,
  Position: PositionConstraints,
  Product: ProductConstraints,
  PurchaseOrder: PurchaseOrderConstraints,
  PurchaseOrderDetail: PurchaseOrderDetailConstraints,
  RequiredDocumentType: DocumentTypeConstraints,
  SaleUnit: SaleUnitConstraints,
  Setting: SettingConstraints,
  ShopOrder: ShopOrderConstraints,
  ShopPayment: ShopPaymentConstraints,
  Subfamily: SubfamilyConstraints,
  Supplier: SupplierConstraints,
  VacationBalance: VacationBalanceConstraints,
  WebUser: WebUserConstraints,
} as const;

/** Campos de interfaz sin columna homónima: el backend recibe el PIN y guarda `pinHash`. */
export const CONSTRAINT_EXCLUSIONS = [
  { model: "Employee", field: "pin", reason: "Se transforma en pinHash en el backend." },
] as const;
