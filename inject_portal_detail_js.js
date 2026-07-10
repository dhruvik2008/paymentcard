const fs = require('fs');
let js = fs.readFileSync('script.js', 'utf-8');

// 1. Add back button listener and showPortalDetails function
const portalDetailJs = `
  const portalDetailSection = document.getElementById('portalDetailSection');
  const portalBalancesSection = document.getElementById('portalBalancesSection');
  const backToPortalsBtn = document.getElementById('backToPortalsBtn');
  
  if (backToPortalsBtn) {
    backToPortalsBtn.addEventListener('click', () => {
      portalDetailSection.style.display = 'none';
      portalBalancesSection.style.display = 'block';
    });
  }

  window.showPortalDetails = (portalName) => {
    portalBalancesSection.style.display = 'none';
    portalDetailSection.style.display = 'block';
    
    document.getElementById('portalDetailTitle').textContent = portalName.toUpperCase();
    
    // We need to gather all impacts for this specific portal, sort them from oldest to newest to compute running balance,
    // then render them newest to oldest.
    let portalImpacts = [];
    
    transactions.forEach(tx => {
      // Debits (Customer Swipes) => Increases Portal Balance (Credit to Portal)
      if (tx.raw && tx.raw.debits) {
        tx.raw.debits.forEach(d => {
          const pName = d.portal || 'Unassigned';
          if (pName === portalName) {
            const amt = parseFloat(d.amount) || 0;
            const fee = parseFloat(d.charges) || 0;
            const impact = amt - fee;
            portalImpacts.push({
              dateStr: tx.date,
              timeStr: tx.time || '',
              parsedDate: new Date(\`\${tx.date} \${tx.time || '12:00 AM'}\`),
              desc: 'Customer Debit - Card Debit',
              badge: 'bill debit',
              partyInfo: tx.customerName,
              bankInfo: \`\${tx.bank || ''} **** \${tx.cardSuffix || ''}\`,
              type: 'Credit',
              debitAmt: null,
              creditAmt: impact
            });
          }
        });
      }
      
      // Payments (Bill Payments) => Decreases Portal Balance (Debit to Portal)
      if (tx.raw && tx.raw.payments) {
        tx.raw.payments.forEach(p => {
          const pName = p.portal || 'Unassigned';
          if (pName === portalName) {
            const amt = parseFloat(p.amount) || 0;
            portalImpacts.push({
              dateStr: tx.date,
              timeStr: tx.time || '',
              parsedDate: new Date(\`\${tx.date} \${tx.time || '12:00 AM'}\`),
              desc: 'Bill Payment - Card Payment',
              badge: 'bill payment',
              partyInfo: tx.customerName,
              bankInfo: \`\${tx.bank || ''} **** \${tx.cardSuffix || ''}\`,
              type: 'Debit',
              debitAmt: amt,
              creditAmt: null
            });
          }
        });
      }
    });

    // Sort oldest to newest for balance calculation
    portalImpacts.sort((a, b) => a.parsedDate - b.parsedDate);
    
    let currentBal = 0;
    let totalCredit = 0;
    let totalDebit = 0;
    
    portalImpacts.forEach(impact => {
      if (impact.type === 'Credit') {
        currentBal += impact.creditAmt;
        totalCredit += impact.creditAmt;
      } else {
        currentBal -= impact.debitAmt;
        totalDebit += impact.debitAmt;
      }
      impact.runningBalance = currentBal;
    });

    // Update Top Summary Cards
    document.getElementById('portalDetailCredit').textContent = '₹' + formatMoney(totalCredit);
    document.getElementById('portalDetailDebit').textContent = '₹' + formatMoney(totalDebit);
    document.getElementById('portalDetailBalance').textContent = '₹' + formatMoney(currentBal);

    // Sort newest to oldest for rendering
    portalImpacts.sort((a, b) => b.parsedDate - a.parsedDate);
    
    const tbody = document.getElementById('portalDetailTableBody');
    if (portalImpacts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #6b7280;">No transactions found.</td></tr>';
      return;
    }

    tbody.innerHTML = portalImpacts.map(impact => {
      const isCredit = impact.type === 'Credit';
      const typeBadge = isCredit 
        ? \`<span style="background: #16a34a; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600;">Credit</span>\`
        : \`<span style="background: #ef4444; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600;">Debit</span>\`;
        
      const detailBadge = \`<span style="border: 1px solid #d1d5db; color: #6b7280; padding: 2px 8px; border-radius: 12px; font-size: 0.65rem; text-transform: uppercase;">\${impact.badge}</span>\`;

      return \`
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 16px;">
            <div style="font-weight: 600; font-size: 0.85rem; color: #111827;">\${impact.dateStr}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">\${impact.timeStr}</div>
          </td>
          <td style="padding: 16px;">
            <div style="font-weight: 500; font-size: 0.85rem; color: #111827; margin-bottom: 4px;">\${impact.desc}</div>
            \${detailBadge}
          </td>
          <td style="padding: 16px;">
            <div style="font-weight: 600; font-size: 0.85rem; color: #111827;">\${impact.partyInfo}</div>
            <div style="font-size: 0.75rem; color: #6b7280;">\${impact.bankInfo}</div>
          </td>
          <td style="padding: 16px;">\${typeBadge}</td>
          <td style="padding: 16px; text-align: right; color: #ef4444; font-weight: 500; font-size: 0.85rem;">
            \${impact.debitAmt !== null ? '₹' + formatMoney(impact.debitAmt) : '-'}
          </td>
          <td style="padding: 16px; text-align: right; color: #16a34a; font-weight: 500; font-size: 0.85rem;">
            \${impact.creditAmt !== null ? '₹' + formatMoney(impact.creditAmt) : '-'}
          </td>
          <td style="padding: 16px; text-align: right; font-weight: 700; color: #111827; font-size: 0.85rem;">
            ₹\${formatMoney(impact.runningBalance)}
          </td>
        </tr>
      \`;
    }).join('');
  };
`;

js = js.replace(/const renderPortalBalances = \(\) => \{/m, portalDetailJs + '\n\n  const renderPortalBalances = () => {');

// 2. Make Portal Cards clickable
js = js.replace(/html \+= \`/g, 'html += `<div style="cursor: pointer; transition: transform 0.2s;" onclick="showPortalDetails(\\\'${pName}\\\')" onmouseover="this.style.transform=\\\'scale(1.02)\\\'" onmouseout="this.style.transform=\\\'scale(1)\\\'">');
js = js.replace(/<\/div>\\n        \`;/g, '</div></div>\n        `;');

fs.writeFileSync('script.js', js);
console.log("Injected Portal Detail JS");
