/**
 * A translated sentence with pieces of the screen inside it: a bold name, a link.
 *
 *   rich(t('Change it any time from {link}.'), { link: <Link href="/account/password">{t('Change password')}</Link> })
 *
 * The sentence keeps its {markers} through t(); here each marker is swapped
 * for its piece, so every language can put the piece where it reads best.
 * No client code, so server and client screens can both use it.
 */
import { Fragment, type ReactNode } from 'react';

export function rich(text: string, parts: Record<string, ReactNode>): ReactNode {
  return text.split(/(\{\w+\})/).map((piece, index) => {
    const name = /^\{(\w+)\}$/.exec(piece)?.[1];
    return <Fragment key={index}>{name !== undefined && name in parts ? parts[name] : piece}</Fragment>;
  });
}
