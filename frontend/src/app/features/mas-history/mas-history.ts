import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-mas-history',
  templateUrl: './mas-history.html',
  styleUrls: ['./mas-history.css']
})
export class MasHistoryComponent implements OnInit {
  transactions = []; // Replace with service call

  constructor(private router: Router) {}

  ngOnInit() {
    // Fetch transactions from your service here
  }

  viewDetails(tx: any) {
    // this.router.navigate(['/analytics/results', tx.id]);
  }
}