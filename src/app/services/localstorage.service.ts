import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalstorageService {

  constructor() { }

 
  setItem(key: string, value: any) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

 
  getItem(key: string) {
    const item = sessionStorage.getItem(key);
    try {
      return item ? JSON.parse(item) : null;
    } catch (e) {
      return item;
    }
  }

  
  removeItem(key: string) {
    sessionStorage.removeItem(key);
  }

 
  clear() {
    sessionStorage.clear();
  }
}