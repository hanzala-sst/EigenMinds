import { ethers } from 'ethers';

/**
 * Utility functions for safe EVM token conversions (MSTC wei <-> MSTC float).
 * Prevents floating point errors when handling blockchain balances.
 */
export class AmountUtils {
  /**
   * Converts MSTC token amount (e.g. 1.0) into wei BigInt string.
   */
  public static parseMSTC(amountMSTC: number | string): bigint {
    const stringValue = typeof amountMSTC === 'number' ? amountMSTC.toString() : amountMSTC;
    return ethers.parseEther(stringValue);
  }

  /**
   * Formats wei BigInt string into human-readable MSTC string (e.g. "1.0").
   */
  public static formatMSTC(weiAmount: bigint | string): string {
    const weiBigInt = typeof weiAmount === 'string' ? BigInt(weiAmount) : weiAmount;
    return ethers.formatEther(weiBigInt);
  }

  /**
   * Shortens a public Ethereum/MST address for UI display (e.g. 0x1234...5678).
   */
  public static shortenAddress(address: string | null | undefined): string {
    if (!address) return '';
    if (address.length < 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }
}
