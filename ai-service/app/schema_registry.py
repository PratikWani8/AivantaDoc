TABLES={
'vendors':['id','name','taxId','email','phone','address','createdAt','updatedAt'],
'purchase_orders':['id','poNumber','vendorId','userId','orderDate','currency','subtotal','tax','total','createdAt','updatedAt'],
'purchase_order_items':['id','purchaseOrderId','description','quantity','unitPrice','tax','total'],
'invoices':['id','invoiceNumber','invoiceDate','dueDate','vendorId','userId','purchaseOrderId','currency','subtotal','tax','discount','total','verificationStatus','createdAt','updatedAt'],
'invoice_items':['id','invoiceId','description','quantity','unitPrice','tax','total'],
'receipts':['id','receiptNumber','invoiceId','receiptDate','amount','currency','createdAt'],
'delivery_notes':['id','deliveryNumber','purchaseOrderId','deliveryDate','vendorId','createdAt'],
'transactions':['id','userId','invoiceId','vendorId','documentConfidence','poMatchScore','vendorTrustScore','priceConsistencyScore','duplicateProbability','transactionTrustScore','riskLevel','riskExplanation','potentialLeakage','verificationStatus','createdAt','updatedAt'],
'risk_events':['id','transactionId','type','severity','confidence','amount','explanation','recommendation','resolvedAt','createdAt'],
'anomalies':['id','transactionId','type','score','severity','explanation','createdAt'],
'erp_records':['id','transactionId','vendorId','invoiceNumber','invoiceDate','purchaseOrderId','subtotal','tax','total','currency','itemsJson','verificationStatus','createdAt','updatedAt']}
def text_schema(): return '\n'.join(f"TABLE {k}: {', '.join(v)}" for k,v in TABLES.items())
